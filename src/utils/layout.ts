import dagre from '@dagrejs/dagre'
import type { OrgNode, OrgEdge } from '@/types'
import { NODE_W, NODE_H } from '@/utils/nodeSize'

export function calcAutoLayout(nodes: OrgNode[], edges: OrgEdge[]): OrgNode[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40, marginx: 40, marginy: 40 })

  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map(n => {
    const { x, y } = g.node(n.id)
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } }
  })
}
