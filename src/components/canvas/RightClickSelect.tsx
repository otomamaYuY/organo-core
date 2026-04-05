import { useEffect, useRef, useState } from 'react'
import { useReactFlow } from 'reactflow'
import type { NodeChange, EdgeChange } from 'reactflow'
import { useOrgStore } from '@/store/useOrgStore'

interface SelectRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

const MIN_DRAG_PX = 4

export function RightClickSelect() {
  const { project } = useReactFlow()
  const { nodes, edges, onNodesChange, onEdgesChange } = useOrgStore()
  const [rect, setRect] = useState<SelectRect | null>(null)
  const isSelecting = useRef(false)

  // Attach mousedown + contextmenu to the pane (empty canvas area)
  useEffect(() => {
    const pane = document.querySelector<HTMLElement>('.react-flow__pane')
    if (!pane) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return
      // Let OrgNode handle right-click on nodes
      if ((e.target as Element).closest('.react-flow__node')) return
      e.preventDefault()
      isSelecting.current = true
      setRect({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY })
    }

    const handleContextMenu = (e: MouseEvent) => {
      // Suppress browser context menu on empty canvas
      if (!(e.target as Element).closest('.react-flow__node')) e.preventDefault()
    }

    pane.addEventListener('mousedown', handleMouseDown)
    pane.addEventListener('contextmenu', handleContextMenu)
    return () => {
      pane.removeEventListener('mousedown', handleMouseDown)
      pane.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Track mousemove / mouseup at window level while a selection is active
  useEffect(() => {
    if (!rect) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting.current) return
      setRect(r => r ? { ...r, endX: e.clientX, endY: e.clientY } : null)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelecting.current) return
      isSelecting.current = false

      const x1 = Math.min(rect.startX, e.clientX)
      const x2 = Math.max(rect.startX, e.clientX)
      const y1 = Math.min(rect.startY, e.clientY)
      const y2 = Math.max(rect.startY, e.clientY)

      // Ignore tiny drags (treat as a plain right-click)
      if (x2 - x1 < MIN_DRAG_PX && y2 - y1 < MIN_DRAG_PX) {
        setRect(null)
        return
      }

      const topLeft = project({ x: x1, y: y1 })
      const bottomRight = project({ x: x2, y: y2 })

      const selectedIds = new Set<string>()
      const nodeChanges: NodeChange[] = nodes.map(n => {
        const w = (n.width ?? 200)
        const h = (n.height ?? 80)
        const inBox =
          n.position.x + w > topLeft.x &&
          n.position.x < bottomRight.x &&
          n.position.y + h > topLeft.y &&
          n.position.y < bottomRight.y
        if (inBox) selectedIds.add(n.id)
        return { type: 'select', id: n.id, selected: inBox }
      })

      const edgeChanges: EdgeChange[] = edges.map(e => ({
        type: 'select',
        id: e.id,
        selected: selectedIds.has(e.source) && selectedIds.has(e.target),
      }))

      onNodesChange(nodeChanges)
      onEdgesChange(edgeChanges)
      setRect(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [rect, nodes, edges, onNodesChange, onEdgesChange, project])

  if (!rect) return null

  const left = Math.min(rect.startX, rect.endX)
  const top = Math.min(rect.startY, rect.endY)
  const width = Math.abs(rect.endX - rect.startX)
  const height = Math.abs(rect.endY - rect.startY)

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width,
        height,
        border: '1.5px dashed var(--accent)',
        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
        pointerEvents: 'none',
        zIndex: 9998,
        borderRadius: 3,
      }}
    />
  )
}
