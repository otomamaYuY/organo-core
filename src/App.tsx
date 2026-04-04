import { useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow'
import type { Edge, Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import { useOrgStore } from '@/store/useOrgStore'
import { useThemeStore } from '@/store/useThemeStore'
import { OrgNode } from '@/components/nodes/OrgNode'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { NodeContextMenu } from '@/components/context-menu/NodeContextMenu'
import { QuickNodeCreationMenu } from '@/components/quick-menu/QuickNodeCreationMenu'
import { FitViewOnLayout } from '@/components/canvas/FitViewOnLayout'
import { ExportBridge } from '@/components/canvas/ExportBridge'
import { EmptyState } from '@/components/canvas/EmptyState'
import { useSearch } from '@/hooks/useSearch'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { HelpButton } from '@/components/onboarding/HelpButton'
import { LandingOverlay } from '@/components/LandingOverlay'
import { useOnboardingStore } from '@/store/useOnboardingStore'

const nodeTypes = { orgNode: OrgNode }

export default function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    setContextMenu,
    searchQuery,
    setQuickCreateMenu,
    reconnectEdge,
    deleteEdge,
  } = useOrgStore()

  const theme = useThemeStore(s => s.theme)

  useEffect(() => {
    useOrgStore.getState().hydrateFromStorage()
    useOnboardingStore.getState().initLanding()
  }, [])

  useAutoSave()
  useBeforeUnload()

  const connectingNodeId = useRef<string | null>(null)
  const edgeReconnectSuccess = useRef(false)
  const connectSucceeded = useRef(false)

  const hitIds = useSearch(nodes, searchQuery)

  const displayNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    return nodes.map(n => ({
      ...n,
      style: { ...n.style, opacity: hitIds.has(n.id) ? 1 : 0.25 },
    }))
  }, [nodes, searchQuery, hitIds])

  const handlePaneClick = useCallback(() => {
    selectNode(null)
    setContextMenu(null)
  }, [selectNode, setContextMenu])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id)
      setContextMenu(null)
    },
    [selectNode, setContextMenu],
  )

  const handleConnectStart = useCallback(
    (_: React.MouseEvent | React.TouchEvent, params: { nodeId: string | null }) => {
      connectingNodeId.current = params.nodeId
    },
    [],
  )

  const handleEdgeUpdateStart = useCallback(() => {
    edgeReconnectSuccess.current = false
  }, [])

  const handleEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccess.current = true
      reconnectEdge(oldEdge.id, {
        source: newConnection.source!,
        target: newConnection.target!,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
      })
    },
    [reconnectEdge],
  )

  const handleEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccess.current) deleteEdge(edge.id)
      edgeReconnectSuccess.current = false
    },
    [deleteEdge],
  )

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      deleteEdge(edge.id)
    },
    [deleteEdge],
  )

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const { source, target } = connection
      if (!source || !target) return false
      // Prevent self-loops
      if (source === target) return false
      // Prevent cycles: BFS from target — if we can reach source, this edge would create a cycle
      const visited = new Set<string>()
      const queue = [target]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (current === source) return false
        if (visited.has(current)) continue
        visited.add(current)
        edges.filter(e => e.source === current).forEach(e => queue.push(e.target))
      }
      return true
    },
    [edges],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      connectSucceeded.current = true
      onConnect(connection)
    },
    [onConnect],
  )

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const sourceId = connectingNodeId.current
      connectingNodeId.current = null

      // Connection was completed successfully — do not show creation menu
      if (connectSucceeded.current) {
        connectSucceeded.current = false
        return
      }

      if (!sourceId) return

      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY

      setQuickCreateMenu({ visible: true, x: clientX, y: clientY, sourceNodeId: sourceId })
    },
    [setQuickCreateMenu],
  )

  const dotColor = theme === 'dark' ? '#2A2A2E' : '#C8C8CE'

  return (
    <div
      data-testid="app-root"
      style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}
    >
      <LandingOverlay />
      <OnboardingTour />
      <HelpButton />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <div data-testid="react-flow-canvas" style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            edgesUpdatable={true}
            onEdgeUpdateStart={handleEdgeUpdateStart}
            onEdgeUpdate={handleEdgeUpdate}
            onEdgeUpdateEnd={handleEdgeUpdateEnd}
            onEdgeClick={handleEdgeClick}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode="Delete"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={dotColor} />
            <Controls position="bottom-right" style={{ marginRight: 215 }} />
            <MiniMap style={{ border: '1px solid var(--border)' }} nodeColor="var(--accent)" />
            <NodeContextMenu />
            <QuickNodeCreationMenu />
            <FitViewOnLayout />
            <ExportBridge />
          </ReactFlow>
          {nodes.length === 0 && <EmptyState />}
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
