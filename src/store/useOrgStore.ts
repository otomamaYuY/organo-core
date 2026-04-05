// IMPORTANT: Any new action that modifies nodes or edges MUST set isDirty: true
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow'
import type { OnNodesChange, OnEdgesChange, OnConnect } from 'reactflow'
import type {
  OrgNode,
  OrgEdge,
  OrgNodeData,
  OrgPersonData,
  OrgUnitData,
  ContextMenuState,
} from '@/types'
import { calcAutoLayout } from '@/utils/layout'

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_PERSON: OrgPersonData = {
  kind: 'person',
  name: '新しいメンバー',
  role: '役職未設定',
  department: '部署未設定',
  tags: [],
}

const DEFAULT_UNIT: OrgUnitData = {
  kind: 'org-unit',
  unitName: '新しい組織',
  unitType: 'department',
  memberCount: 0,
  childUnitCount: 0,
  tags: [],
}

const initialNodes: OrgNode[] = [
  {
    id: 'node_ceo',
    type: 'orgNode',
    position: { x: 400, y: 50 },
    data: {
      kind: 'person',
      name: 'Dr. Sarah Chen',
      role: 'CEO',
      department: '経営',
      employmentType: 'full-time',
      tags: ['Executive'],
    },
  },
  {
    id: 'node_cto',
    type: 'orgNode',
    position: { x: 150, y: 200 },
    data: {
      kind: 'person',
      name: 'Michael Rodriguez',
      role: 'CTO',
      department: '技術',
      employmentType: 'full-time',
      tags: ['Engineering'],
    },
  },
  {
    id: 'node_coo',
    type: 'orgNode',
    position: { x: 650, y: 200 },
    data: {
      kind: 'person',
      name: 'Emily Watson',
      role: 'COO',
      department: '管理',
      employmentType: 'full-time',
      tags: ['Operations'],
    },
  },
  {
    id: 'node_unit_hr',
    type: 'orgNode',
    position: { x: 400, y: 380 },
    data: {
      kind: 'org-unit',
      unitName: '人事部',
      unitType: 'department',
      headPersonName: '鈴木 花子',
      memberCount: 12,
      tags: ['HR'],
    },
  },
]

const initialEdges: OrgEdge[] = [
  {
    id: 'e1',
    source: 'node_ceo',
    target: 'node_cto',
    type: 'smoothstep',
    animated: true,
    data: { relationshipType: 'reports-to' },
  },
  {
    id: 'e2',
    source: 'node_ceo',
    target: 'node_coo',
    type: 'smoothstep',
    animated: true,
    data: { relationshipType: 'reports-to' },
  },
  {
    id: 'e3',
    source: 'node_coo',
    target: 'node_unit_hr',
    type: 'smoothstep',
    animated: true,
    data: { relationshipType: 'reports-to' },
  },
]

interface QuickCreateMenuState {
  visible: boolean
  x: number
  y: number
  sourceNodeId: string | null
  handleType: 'source' | 'target' | null
}

interface OrgState {
  nodes: OrgNode[]
  edges: OrgEdge[]
  selectedNodeId: string | null
  searchQuery: string
  layoutVersion: number
  contextMenu: ContextMenuState | null
  quickCreateMenu: QuickCreateMenuState
  isDirty: boolean

  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  addPersonNode: (parentId?: string, position?: { x: number; y: number }, initialData?: Partial<OrgPersonData>, updateParentCount?: boolean) => void
  insertPersonAboveNode: (targetNodeId: string, initialData?: Partial<OrgPersonData>) => string
  addUnitNode: (parentId?: string, position?: { x: number; y: number }) => void
  updateNode: (id: string, data: Partial<OrgNodeData>) => void
  deleteNode: (id: string) => void
  toggleCollapse: (id: string) => void

  selectNode: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setContextMenu: (menu: ContextMenuState | null) => void
  setQuickCreateMenu: (menu: QuickCreateMenuState) => void

  reconnectEdge: (
    oldEdgeId: string,
    newConnection: {
      source: string
      target: string
      sourceHandle?: string | null
      targetHandle?: string | null
    },
  ) => void
  deleteEdge: (id: string) => void
  deleteSelected: () => void
  connectNodes: (parentId: string, childId: string) => void
  applyAutoLayout: () => void

  importFromJson: (json: unknown) => void
  exportToJson: () => void
  mergePersonNodes: (newNodes: OrgNode[], newEdges: OrgEdge[]) => void
  replaceWithPersonNodes: (newNodes: OrgNode[], newEdges: OrgEdge[]) => void

  markDirty: () => void
  markClean: () => void
  resetToDefault: () => void
  hydrateFromStorage: () => void
}

// Recursively get all descendant node IDs
function getDescendantIds(nodeId: string, edges: OrgEdge[]): string[] {
  const directChildren = edges.filter(e => e.source === nodeId).map(e => e.target)
  return directChildren.flatMap(childId => [childId, ...getDescendantIds(childId, edges)])
}

export const useOrgStore = create<OrgState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  searchQuery: '',
  layoutVersion: 0,
  contextMenu: null,
  quickCreateMenu: { visible: false, x: 0, y: 0, sourceNodeId: null, handleType: null },
  isDirty: false,

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  resetToDefault: () => {
    localStorage.removeItem('organo-core-data')
    set({ nodes: initialNodes, edges: initialEdges, selectedNodeId: null, isDirty: false })
  },

  hydrateFromStorage: () => {
    try {
      const raw = localStorage.getItem('organo-core-data')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return
      set({ nodes: parsed.nodes, edges: parsed.edges, isDirty: false })
    } catch {
      // Ignore parse errors
    }
  },

  onNodesChange: changes =>
    set(state => ({
      nodes: applyNodeChanges(changes, state.nodes) as OrgNode[],
      isDirty: true,
    })),

  onEdgesChange: changes =>
    set(state => ({
      edges: applyEdgeChanges(changes, state.edges) as OrgEdge[],
      isDirty: true,
    })),

  onConnect: connection =>
    set(state => {
      const sourceNode = state.nodes.find(n => n.id === connection.source)
      const targetNode = state.nodes.find(n => n.id === connection.target)
      const isPersonUnderUnit =
        sourceNode?.data.kind === 'org-unit' && targetNode?.data.kind === 'person'

      const nodes = isPersonUnderUnit
        ? state.nodes.map(n => {
            if (n.id === connection.source) {
              const d = n.data as OrgUnitData
              return { ...n, data: { ...d, memberCount: (d.memberCount ?? 0) + 1 } }
            }
            return n
          })
        : state.nodes

      return {
        nodes,
        edges: addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            data: { relationshipType: 'reports-to' },
          },
          state.edges,
        ) as OrgEdge[],
        isDirty: true,
      }
    }),

  addPersonNode: (parentId, position, initialData, updateParentCount = true) => {
    const id = generateId()
    const parentNode = parentId ? get().nodes.find(n => n.id === parentId) : null
    const nodePosition =
      position ||
      (parentNode
        ? { x: parentNode.position.x + 50, y: parentNode.position.y + 150 }
        : { x: 200, y: 200 })

    const parentDepartment =
      parentNode?.data.kind === 'org-unit' ? parentNode.data.unitName : undefined

    const newNode: OrgNode = {
      id,
      type: 'orgNode',
      position: nodePosition,
      data: {
        ...DEFAULT_PERSON,
        ...(parentDepartment ? { department: parentDepartment } : {}),
        ...initialData,
      },
    }

    const shouldIncrementCount = updateParentCount && parentNode?.data.kind === 'org-unit'

    set(state => ({
      nodes: shouldIncrementCount
        ? state.nodes.map(n => {
            if (n.id === parentId) {
              const d = n.data as OrgUnitData
              return { ...n, data: { ...d, memberCount: (d.memberCount ?? 0) + 1 } }
            }
            return n
          }).concat(newNode)
        : [...state.nodes, newNode],
      edges: parentId
        ? [
            ...state.edges,
            {
              id: `e_${parentId}_${id}`,
              source: parentId,
              target: id,
              type: 'smoothstep',
              animated: true,
              data: { relationshipType: 'reports-to' },
            },
          ]
        : state.edges,
      selectedNodeId: id,
      isDirty: true,
    }))
  },

  insertPersonAboveNode: (targetNodeId, initialData) => {
    const id = generateId()
    const state = get()
    const targetNode = state.nodes.find(n => n.id === targetNodeId)
    const parentEdge = state.edges.find(e => e.target === targetNodeId)
    const parentNode = parentEdge ? state.nodes.find(n => n.id === parentEdge.source) : null

    const nodePosition = targetNode
      ? { x: targetNode.position.x, y: targetNode.position.y - 150 }
      : { x: 200, y: 200 }

    const newNode: OrgNode = {
      id,
      type: 'orgNode',
      position: nodePosition,
      data: { ...DEFAULT_PERSON, ...initialData },
    }

    set(state => {
      const filteredEdges = parentEdge
        ? state.edges.filter(e => e.id !== parentEdge.id)
        : state.edges
      const newEdges: OrgEdge[] = [
        ...filteredEdges,
        // parent → new person (only if a parent existed)
        ...(parentNode
          ? [
              {
                id: `e_${parentNode.id}_${id}`,
                source: parentNode.id,
                target: id,
                type: 'smoothstep',
                animated: true,
                data: { relationshipType: 'reports-to' },
              } satisfies OrgEdge,
            ]
          : []),
        // new person → target org unit
        {
          id: `e_${id}_${targetNodeId}`,
          source: id,
          target: targetNodeId,
          type: 'smoothstep',
          animated: true,
          data: { relationshipType: 'reports-to' },
        },
      ]
      return { nodes: [...state.nodes, newNode], edges: newEdges, isDirty: true }
    })

    return id
  },

  addUnitNode: (parentId, position) => {
    const id = generateId()
    const parentNode = parentId ? get().nodes.find(n => n.id === parentId) : null
    const nodePosition =
      position ||
      (parentNode
        ? { x: parentNode.position.x + 50, y: parentNode.position.y + 150 }
        : { x: 200, y: 200 })

    const parentHeadName =
      parentNode?.data.kind === 'person' ? parentNode.data.name : undefined

    const newNode: OrgNode = {
      id,
      type: 'orgNode',
      position: nodePosition,
      data: {
        ...DEFAULT_UNIT,
        ...(parentHeadName ? { headPersonName: parentHeadName } : {}),
      },
    }

    set(state => ({
      nodes: [...state.nodes, newNode],
      edges: parentId
        ? [
            ...state.edges,
            {
              id: `e_${parentId}_${id}`,
              source: parentId,
              target: id,
              type: 'smoothstep',
              animated: true,
              data: { relationshipType: 'reports-to' },
            },
          ]
        : state.edges,
      selectedNodeId: id,
      isDirty: true,
    }))
  },

  updateNode: (id, data) =>
    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, ...data } as OrgNodeData } : n,
      ),
      isDirty: true,
    })),

  deleteNode: id =>
    set(state => {
      const target = state.nodes.find(n => n.id === id)
      let nodes = state.nodes.filter(n => n.id !== id)

      // If a person node is removed, decrement the parent org-unit's memberCount
      if (target?.data.kind === 'person') {
        const parentEdge = state.edges.find(e => e.target === id)
        if (parentEdge) {
          nodes = nodes.map(n => {
            if (n.id === parentEdge.source && n.data.kind === 'org-unit') {
              const d = n.data as OrgUnitData
              return { ...n, data: { ...d, memberCount: Math.max(0, (d.memberCount ?? 0) - 1) } }
            }
            return n
          })
        }
      }

      return {
        nodes,
        edges: state.edges.filter(e => e.source !== id && e.target !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        isDirty: true,
      }
    }),

  toggleCollapse: id =>
    set(state => {
      const node = state.nodes.find(n => n.id === id)
      if (!node) return state

      const isCollapsed = node.data.isCollapsed ?? false
      const newCollapsed = !isCollapsed
      const descendantIds = getDescendantIds(id, state.edges)
      const childCount = state.edges.filter(e => e.source === id).length

      return {
        nodes: state.nodes.map(n => {
          if (n.id === id) {
            return {
              ...n,
              data: { ...n.data, isCollapsed: newCollapsed, childCount } as OrgNodeData,
            }
          }
          if (descendantIds.includes(n.id)) {
            return { ...n, hidden: newCollapsed }
          }
          return n
        }),
        edges: state.edges.map(e => {
          if (e.source === id || descendantIds.includes(e.source)) {
            return { ...e, hidden: newCollapsed }
          }
          return e
        }),
        isDirty: true,
      }
    }),

  reconnectEdge: (oldEdgeId, newConnection) =>
    set(state => {
      const oldEdge = state.edges.find(e => e.id === oldEdgeId)
      const oldSource = oldEdge ? state.nodes.find(n => n.id === oldEdge.source) : null
      const oldTarget = oldEdge ? state.nodes.find(n => n.id === oldEdge.target) : null
      const newSource = state.nodes.find(n => n.id === newConnection.source)
      const newTarget = state.nodes.find(n => n.id === newConnection.target)

      let nodes = state.nodes

      // Decrement old org-unit if the old connection was org-unit → person
      if (oldSource?.data.kind === 'org-unit' && oldTarget?.data.kind === 'person') {
        nodes = nodes.map(n => {
          if (n.id === oldSource.id) {
            const d = n.data as OrgUnitData
            return { ...n, data: { ...d, memberCount: Math.max(0, (d.memberCount ?? 0) - 1) } }
          }
          return n
        })
      }

      // Increment new org-unit if the new connection is org-unit → person
      if (newSource?.data.kind === 'org-unit' && newTarget?.data.kind === 'person') {
        nodes = nodes.map(n => {
          if (n.id === newSource.id) {
            const d = n.data as OrgUnitData
            return { ...n, data: { ...d, memberCount: (d.memberCount ?? 0) + 1 } }
          }
          return n
        })
      }

      return {
        nodes,
        edges: state.edges.map(e =>
          e.id === oldEdgeId
            ? {
                ...e,
                source: newConnection.source,
                target: newConnection.target,
                sourceHandle: newConnection.sourceHandle ?? null,
                targetHandle: newConnection.targetHandle ?? null,
              }
            : e,
        ),
        isDirty: true,
      }
    }),

  deleteEdge: id =>
    set(state => {
      const edge = state.edges.find(e => e.id === id)
      const sourceNode = edge ? state.nodes.find(n => n.id === edge.source) : null
      const targetNode = edge ? state.nodes.find(n => n.id === edge.target) : null

      const nodes =
        sourceNode?.data.kind === 'org-unit' && targetNode?.data.kind === 'person'
          ? state.nodes.map(n => {
              if (n.id === sourceNode.id) {
                const d = n.data as OrgUnitData
                return { ...n, data: { ...d, memberCount: Math.max(0, (d.memberCount ?? 0) - 1) } }
              }
              return n
            })
          : state.nodes

      return {
        nodes,
        edges: state.edges.filter(e => e.id !== id),
        isDirty: true,
      }
    }),

  connectNodes: (parentId, childId) =>
    set(state => ({
      edges: [
        ...state.edges,
        {
          id: `e_${parentId}_${childId}`,
          source: parentId,
          target: childId,
          type: 'smoothstep',
          animated: true,
          data: { relationshipType: 'reports-to' },
        },
      ],
      isDirty: true,
    })),

  deleteSelected: () =>
    set(state => {
      const selectedNodeIds = new Set(state.nodes.filter(n => n.selected).map(n => n.id))
      const selectedEdgeIds = new Set(state.edges.filter(e => e.selected).map(e => e.id))
      if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return state

      // Decrement memberCount for each org-unit that loses a person child
      let nodes = state.nodes
      for (const id of selectedNodeIds) {
        const target = state.nodes.find(n => n.id === id)
        if (target?.data.kind === 'person') {
          const parentEdge = state.edges.find(e => e.target === id)
          if (parentEdge && !selectedNodeIds.has(parentEdge.source)) {
            nodes = nodes.map(n => {
              if (n.id === parentEdge.source && n.data.kind === 'org-unit') {
                const d = n.data as OrgUnitData
                return { ...n, data: { ...d, memberCount: Math.max(0, (d.memberCount ?? 0) - 1) } }
              }
              return n
            })
          }
        }
      }

      return {
        nodes: nodes.filter(n => !selectedNodeIds.has(n.id)),
        edges: state.edges.filter(
          e => !selectedEdgeIds.has(e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
        ),
        selectedNodeId: selectedNodeIds.has(state.selectedNodeId ?? '') ? null : state.selectedNodeId,
        isDirty: true,
      }
    }),

  applyAutoLayout: () =>
    set(state => ({
      nodes: calcAutoLayout(state.nodes, state.edges),
      edges: state.edges.map(e => ({ ...e, type: 'step' })),
      layoutVersion: state.layoutVersion + 1,
      isDirty: true,
    })),

  selectNode: id => set({ selectedNodeId: id }),
  setSearchQuery: q => set({ searchQuery: q }),
  setContextMenu: menu => set({ contextMenu: menu }),
  setQuickCreateMenu: menu => set({ quickCreateMenu: menu }),

  importFromJson: json => {
    try {
      const data = json as { nodes: OrgNode[]; edges: OrgEdge[] }
      if (!data.nodes || !data.edges) throw new Error('Invalid format')
      set({ nodes: data.nodes, edges: data.edges, selectedNodeId: null, isDirty: true })
    } catch {
      alert('JSONファイルの形式が正しくありません')
    }
  },

  mergePersonNodes: (newNodes, newEdges) =>
    set(state => ({
      nodes: [...state.nodes, ...newNodes],
      edges: [...state.edges, ...newEdges],
      isDirty: true,
    })),

  replaceWithPersonNodes: (newNodes, newEdges) =>
    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: null,
      isDirty: true,
    }),

  exportToJson: () => {
    const { nodes, edges } = get()
    const data = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organogram_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
