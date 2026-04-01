import { useMemo } from 'react'
import type { OrgNode } from '@/types'

export function useSearch(nodes: OrgNode[], query: string): Set<string> {
  return useMemo(() => {
    if (!query.trim()) return new Set()
    const q = query.toLowerCase()
    const hits = new Set<string>()
    for (const node of nodes) {
      const d = node.data
      if (d.kind === 'person') {
        if (
          d.name.toLowerCase().includes(q) ||
          d.role.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.tags?.some(t => t.toLowerCase().includes(q))
        )
          hits.add(node.id)
      } else {
        if (
          d.unitName.toLowerCase().includes(q) ||
          (d.headPersonName ?? '').toLowerCase().includes(q) ||
          d.tags?.some(t => t.toLowerCase().includes(q))
        )
          hits.add(node.id)
      }
    }
    return hits
  }, [nodes, query])
}
