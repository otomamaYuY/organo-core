import { useState, useCallback } from 'react'
import type { ExtractedPerson } from '@/services/llm'
import { useOrgStore } from '@/store/useOrgStore'
import { toast } from '@/store/useToastStore'
import { translations } from '@/i18n/translations'
import { useLocaleStore } from '@/store/useLocaleStore'
import type { OrgNode, OrgEdge, OrgPersonData } from '@/types'

interface AiImportState {
  result: ExtractedPerson[]
}

const generateNodeId = () => `node_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

/**
 * Converts ExtractedPerson[] (with temp ids) into OrgNode[] + OrgEdge[].
 * Positions are staggered; applyAutoLayout will arrange them properly after merge.
 */
function buildNodesAndEdges(persons: ExtractedPerson[]): {
  nodes: OrgNode[]
  edges: OrgEdge[]
} {
  // Map temp id → real node id
  const idMap = new Map<string, string>()
  persons.forEach((p) => {
    idMap.set(p.id, generateNodeId())
  })

  const nodes: OrgNode[] = persons.map((p, i) => {
    const realId = idMap.get(p.id)!
    const data: OrgPersonData = {
      kind: 'person',
      name: p.name,
      role: p.role ?? '',
      department: p.department ?? '',
      email: p.email ?? undefined,
      employmentType: p.employmentType ?? undefined,
      tags: [],
    }
    return {
      id: realId,
      type: 'orgNode',
      position: { x: 100 + (i % 5) * 200, y: 100 + Math.floor(i / 5) * 160 },
      data,
    }
  })

  const edges: OrgEdge[] = persons
    .filter((p) => p.parentId !== null && p.parentId !== undefined && idMap.has(p.parentId))
    .map((p) => {
      const sourceId = idMap.get(p.parentId!)!
      const targetId = idMap.get(p.id)!
      return {
        id: `e_ai_${sourceId}_${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
        animated: true,
        data: { relationshipType: 'reports-to' as const },
      }
    })

  return { nodes, edges }
}

export function useAiImport() {
  const [state, setState] = useState<AiImportState>({
    result: [],
  })

  const locale = useLocaleStore((s) => s.locale)
  const mergePersonNodes = useOrgStore((s) => s.mergePersonNodes)
  const replaceWithPersonNodes = useOrgStore((s) => s.replaceWithPersonNodes)
  const applyAutoLayout = useOrgStore((s) => s.applyAutoLayout)

  const applyToChart = useCallback(
    (persons: ExtractedPerson[], mode: 'append' | 'replace') => {
      const { nodes, edges } = buildNodesAndEdges(persons)
      if (mode === 'replace') {
        replaceWithPersonNodes(nodes, edges)
        const msg = translations.toastReplaced[locale].replace('{{count}}', String(persons.length))
        toast.success(msg)
      } else {
        mergePersonNodes(nodes, edges)
        const msg = translations.toastApplied[locale].replace('{{count}}', String(persons.length))
        toast.success(msg)
      }
      // Auto-layout after merge for clean hierarchy
      setTimeout(() => applyAutoLayout(), 50)
      setState({ result: [] })
    },
    [mergePersonNodes, replaceWithPersonNodes, applyAutoLayout, locale],
  )

  const reset = useCallback(() => {
    setState({ result: [] })
  }, [])

  return {
    result: state.result,
    applyToChart,
    reset,
  }
}
