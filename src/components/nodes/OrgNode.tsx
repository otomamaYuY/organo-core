import { memo, useCallback } from 'react'
import { Handle, Position, useStore } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { PersonCard } from './PersonCard'
import { UnitBanner } from './UnitBanner'
import type { OrgNodeData } from '@/types'
import { useOrgStore } from '@/store/useOrgStore'

const handleBaseStyle = {
  background: '#3b82f6',
  width: 10,
  height: 10,
  border: '2px solid #1e40af',
  transition: 'opacity 0.15s',
}

function OrgNodeComponent({ id, data, selected }: NodeProps<OrgNodeData>) {
  const setContextMenu = useOrgStore(s => s.setContextMenu)
  const connectionNodeId = useStore(s => s.connectionNodeId)
  const connectionHandleType = useStore(s => s.connectionHandleType)

  // Derive actual child counts from edges for org-unit display
  const personChildCount = useOrgStore(s => {
    if (data.kind !== 'org-unit') return 0
    return s.edges.filter(e => {
      if (e.source !== id) return false
      const target = s.nodes.find(n => n.id === e.target)
      return target?.data.kind === 'person'
    }).length
  })
  const unitChildCount = useOrgStore(s => {
    if (data.kind !== 'org-unit') return 0
    return s.edges.filter(e => {
      if (e.source !== id) return false
      const target = s.nodes.find(n => n.id === e.target)
      return target?.data.kind === 'org-unit'
    }).length
  })

  const isConnecting = !!connectionNodeId
  const isSelf = connectionNodeId === id

  // While connecting:
  //   - Source handles are hidden on all nodes (can't connect source→source)
  //   - Target handles are hidden on all nodes (can't connect target→target)
  //   - The opposite handle on the node being dragged from is also hidden (no self-loops)
  const showSourceHandle = !isConnecting || (connectionHandleType === 'target' && !isSelf)
  const showTargetHandle = !isConnecting || (connectionHandleType === 'source' && !isSelf)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id })
    },
    [id, setContextMenu],
  )

  return (
    <div data-testid={`org-node-${id}`} data-tour="org-node" onContextMenu={handleContextMenu}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          ...handleBaseStyle,
          opacity: showTargetHandle ? 1 : 0,
          pointerEvents: showTargetHandle ? 'auto' : 'none',
        }}
      />
      {data.kind === 'person' ? (
        <PersonCard data={data} selected={selected ?? false} />
      ) : (
        <UnitBanner
          data={data}
          selected={selected ?? false}
          personChildCount={personChildCount}
          unitChildCount={unitChildCount}
        />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          ...handleBaseStyle,
          opacity: showSourceHandle ? 1 : 0,
          pointerEvents: showSourceHandle ? 'auto' : 'none',
        }}
      />
    </div>
  )
}

export const OrgNode = memo(OrgNodeComponent)
