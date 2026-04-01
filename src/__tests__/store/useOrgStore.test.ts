import { describe, it, expect, beforeEach } from 'vitest'
import { useOrgStore } from '@/store/useOrgStore'
import { act } from '@testing-library/react'

describe('useOrgStore', () => {
  beforeEach(() => {
    useOrgStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      searchQuery: '',
      contextMenu: null,
    })
  })

  it('addPersonNode adds a person node', () => {
    act(() => useOrgStore.getState().addPersonNode())
    const { nodes } = useOrgStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].data.kind).toBe('person')
    expect(nodes[0].type).toBe('orgNode')
  })

  it('addUnitNode adds an org-unit node', () => {
    act(() => useOrgStore.getState().addUnitNode())
    const { nodes } = useOrgStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].data.kind).toBe('org-unit')
  })

  it('addPersonNode with parentId creates an edge', () => {
    act(() => useOrgStore.getState().addPersonNode())
    const parentId = useOrgStore.getState().nodes[0].id
    act(() => useOrgStore.getState().addPersonNode(parentId))
    const { edges } = useOrgStore.getState()
    expect(edges).toHaveLength(1)
    expect(edges[0].source).toBe(parentId)
  })

  it('deleteNode removes node and its edges', () => {
    act(() => useOrgStore.getState().addPersonNode())
    const parentId = useOrgStore.getState().nodes[0].id
    act(() => useOrgStore.getState().addPersonNode(parentId))
    act(() => useOrgStore.getState().deleteNode(parentId))
    const { nodes, edges } = useOrgStore.getState()
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it('updateNode updates node data', () => {
    act(() => useOrgStore.getState().addPersonNode())
    const id = useOrgStore.getState().nodes[0].id
    act(() =>
      useOrgStore
        .getState()
        .updateNode(id, { kind: 'person', name: '田中太郎', role: '課長', department: '経理' }),
    )
    const node = useOrgStore.getState().nodes.find(n => n.id === id)
    expect(node?.data.kind).toBe('person')
    if (node?.data.kind === 'person') {
      expect(node.data.name).toBe('田中太郎')
    }
  })

  it('toggleCollapse hides children', () => {
    act(() => useOrgStore.getState().addPersonNode())
    const parentId = useOrgStore.getState().nodes[0].id
    act(() => useOrgStore.getState().addPersonNode(parentId))
    const childId = useOrgStore.getState().nodes[1].id
    act(() => useOrgStore.getState().toggleCollapse(parentId))
    const { nodes } = useOrgStore.getState()
    const child = nodes.find(n => n.id === childId)
    expect(child?.hidden).toBe(true)
  })
})
