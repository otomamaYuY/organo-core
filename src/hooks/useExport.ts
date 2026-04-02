import { toPng, toSvg } from 'html-to-image'
import jsPDF from 'jspdf'
import type { ReactFlowInstance } from 'reactflow'
import { useOrgStore } from '@/store/useOrgStore'
import {
  getTimestamp,
  downloadText,
  buildTreeJson,
  buildFlatCsv,
  buildStandaloneHtml,
} from '@/utils/exportUtils'

// ─── React Flow Instance Bridge ────────────────────────────────────────────
// Set by ExportBridge component rendered inside <ReactFlow>
let rfInstance: ReactFlowInstance | null = null

export function setReactFlowInstance(instance: ReactFlowInstance | null) {
  rfInstance = instance
}

// ─── Constants ──────────────────────────────────────────────────────────────
const BG_COLOR = '#0f172a'
const FIT_VIEW_PADDING = 0.08
const RENDER_WAIT_MS = 300

// ─── Edge SVG → <img> Workaround ───────────────────────────────────────────
// html-to-image wraps DOM in SVG foreignObject. Nested SVG elements inside
// foreignObject fail to render when the browser converts the SVG to a canvas.
// Workaround: temporarily replace the edge <svg> with an <img> (data URI of
// the serialized SVG) so the browser only needs to render HTML + images.

function inlineEdgeSvgStyles(
  clonedSvg: SVGSVGElement,
  originalSvg: SVGSVGElement,
): void {
  const clonedPaths = clonedSvg.querySelectorAll('path')
  const originalPaths = originalSvg.querySelectorAll('path')
  for (let i = 0; i < clonedPaths.length; i++) {
    const computed = window.getComputedStyle(originalPaths[i])
    clonedPaths[i].setAttribute('stroke', computed.stroke)
    clonedPaths[i].setAttribute('stroke-width', computed.strokeWidth)
    if (computed.strokeDasharray) {
      clonedPaths[i].setAttribute('stroke-dasharray', computed.strokeDasharray)
    }
    clonedPaths[i].setAttribute('fill', computed.fill)
  }

  const clonedGs = clonedSvg.querySelectorAll('g')
  const originalGs = originalSvg.querySelectorAll('g')
  for (let i = 0; i < clonedGs.length; i++) {
    const computed = window.getComputedStyle(originalGs[i])
    if (computed.opacity !== '1') {
      clonedGs[i].setAttribute('opacity', computed.opacity)
    }
  }
}

async function replaceEdgeSvgWithImg(
  viewportEl: HTMLElement,
): Promise<(() => void) | null> {
  const edgeSvg = viewportEl.querySelector(
    '.react-flow__edges',
  ) as SVGSVGElement | null
  if (!edgeSvg) return null

  // Clone and inline all computed styles
  const clonedSvg = edgeSvg.cloneNode(true) as SVGSVGElement
  inlineEdgeSvgStyles(clonedSvg, edgeSvg)

  // Serialize to data URI
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clonedSvg)
  const svgDataUri =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)

  // Create replacement <img>
  const img = document.createElement('img')
  img.src = svgDataUri
  const svgW = edgeSvg.getAttribute('width') ?? '0'
  const svgH = edgeSvg.getAttribute('height') ?? '0'
  const existingStyle = edgeSvg.getAttribute('style') ?? ''
  img.style.cssText = `${existingStyle};position:absolute;top:0;left:0;width:${svgW}px;height:${svgH}px;`

  // Wait for the image to load
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Edge SVG image failed to load'))
  })

  // Swap: hide original SVG, insert img before it
  edgeSvg.style.display = 'none'
  viewportEl.insertBefore(img, edgeSvg)

  // Return a restore function
  return () => {
    viewportEl.removeChild(img)
    edgeSvg.style.display = ''
  }
}

// ─── Capture Helper ─────────────────────────────────────────────────────────

async function captureFullGraph(
  format: 'png' | 'svg',
  pixelRatio = 2,
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!rfInstance) throw new Error('React Flow instance not available')

  const nodes = rfInstance.getNodes()
  if (nodes.length === 0) throw new Error('No nodes to export')

  const viewportEl = document.querySelector(
    '.react-flow__viewport',
  ) as HTMLElement | null
  const rendererEl = document.querySelector(
    '.react-flow__renderer',
  ) as HTMLElement | null
  if (!viewportEl || !rendererEl)
    throw new Error('React Flow DOM elements not found')

  // Save current viewport, then fit all nodes
  const savedViewport = rfInstance.getViewport()
  rfInstance.fitView({ padding: FIT_VIEW_PADDING, duration: 0 })

  // Wait for DOM to settle after fitView
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => setTimeout(resolve, RENDER_WAIT_MS))
  })

  // Replace edge SVG with img to work around html-to-image foreignObject bug
  const restoreEdges = await replaceEdgeSvgWithImg(viewportEl)

  const width = rendererEl.offsetWidth
  const height = rendererEl.offsetHeight
  const currentTransform = window.getComputedStyle(viewportEl).transform

  try {
    const options = {
      backgroundColor: BG_COLOR,
      width,
      height,
      pixelRatio: format === 'png' ? pixelRatio : 1,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: currentTransform,
      },
      filter: (node: Element) => {
        const exclude = [
          'react-flow__minimap',
          'react-flow__controls',
          'react-flow__background',
          'react-flow__attribution',
        ]
        return !exclude.some(cls => node.classList?.contains(cls))
      },
    }

    const captureFn = format === 'png' ? toPng : toSvg
    const dataUrl = await captureFn(viewportEl, options)
    return { dataUrl, width, height }
  } finally {
    // Always restore edge SVG and viewport
    restoreEdges?.()
    rfInstance.setViewport(savedViewport, { duration: 0 })
  }
}

// ─── Export Hook ─────────────────────────────────────────────────────────────
export function useExport() {
  const exportToTreeJson = () => {
    const { nodes, edges } = useOrgStore.getState()
    const tree = buildTreeJson(nodes, edges)
    downloadText(
      JSON.stringify(tree, null, 2),
      `organogram_${getTimestamp()}.json`,
      'application/json',
    )
  }

  const exportToFlatCsv = () => {
    const { nodes, edges } = useOrgStore.getState()
    const csv = buildFlatCsv(nodes, edges)
    downloadText(
      csv,
      `organogram_${getTimestamp()}.csv`,
      'text/csv;charset=utf-8',
    )
  }

  const exportToHtml = () => {
    const { nodes, edges } = useOrgStore.getState()
    const html = buildStandaloneHtml(nodes, edges)
    downloadText(
      html,
      `organogram_${getTimestamp()}.html`,
      'text/html;charset=utf-8',
    )
  }

  const exportToPng = async () => {
    const { dataUrl } = await captureFullGraph('png', 2)
    const a = document.createElement('a')
    a.download = `organogram_${new Date().toISOString().slice(0, 10)}.png`
    a.href = dataUrl
    a.click()
  }

  const exportToSvg = async () => {
    const { dataUrl } = await captureFullGraph('svg')
    const a = document.createElement('a')
    a.download = `organogram_${new Date().toISOString().slice(0, 10)}.svg`
    a.href = dataUrl
    a.click()
  }

  const exportToPdf = async () => {
    const { dataUrl, width, height } = await captureFullGraph('png', 2)
    const orientation = width >= height ? 'landscape' : 'portrait'
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [width, height],
    })
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
    pdf.save(`organogram_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return {
    exportToPng,
    exportToSvg,
    exportToPdf,
    exportToTreeJson,
    exportToFlatCsv,
    exportToHtml,
  }
}
