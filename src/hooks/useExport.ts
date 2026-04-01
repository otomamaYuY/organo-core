import { toPng, toSvg } from 'html-to-image'
import jsPDF from 'jspdf'
import { useOrgStore } from '@/store/useOrgStore'
import {
  getTimestamp,
  downloadText,
  buildTreeJson,
  buildFlatCsv,
  buildStandaloneHtml,
} from '@/utils/exportUtils'

export function useExport() {
  const getCanvas = () => document.querySelector('.react-flow__renderer') as HTMLElement | null

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
    downloadText(csv, `organogram_${getTimestamp()}.csv`, 'text/csv;charset=utf-8')
  }

  const exportToHtml = () => {
    const { nodes, edges } = useOrgStore.getState()
    const html = buildStandaloneHtml(nodes, edges)
    downloadText(html, `organogram_${getTimestamp()}.html`, 'text/html;charset=utf-8')
  }

  const exportToPng = async () => {
    const el = getCanvas()
    if (!el) return
    const dataUrl = await toPng(el, { backgroundColor: '#0f172a', pixelRatio: 2 })
    const a = document.createElement('a')
    a.download = `organogram_${new Date().toISOString().slice(0, 10)}.png`
    a.href = dataUrl
    a.click()
  }

  const exportToSvg = async () => {
    const el = getCanvas()
    if (!el) return
    const dataUrl = await toSvg(el, { backgroundColor: '#0f172a' })
    const a = document.createElement('a')
    a.download = `organogram_${new Date().toISOString().slice(0, 10)}.svg`
    a.href = dataUrl
    a.click()
  }

  const exportToPdf = async () => {
    const el = getCanvas()
    if (!el) return
    const dataUrl = await toPng(el, { backgroundColor: '#0f172a', pixelRatio: 2 })
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [el.offsetWidth, el.offsetHeight],
    })
    pdf.addImage(dataUrl, 'PNG', 0, 0, el.offsetWidth, el.offsetHeight)
    pdf.save(`organogram_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return { exportToPng, exportToSvg, exportToPdf, exportToTreeJson, exportToFlatCsv, exportToHtml }
}
