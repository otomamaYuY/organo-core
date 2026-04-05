import { useState, useCallback } from 'react'
import { importGraphFromImage, type ExtractedPerson } from '@/services/llm'
import { useLlmSettingsStore } from '@/store/useLlmSettingsStore'
import { useOrgStore } from '@/store/useOrgStore'
import { toast } from '@/store/useToastStore'
import { translations } from '@/i18n/translations'
import { useLocaleStore } from '@/store/useLocaleStore'
import type { OrgNode, OrgEdge, OrgPersonData } from '@/types'

export type AiImportPhase = 'idle' | 'loading' | 'preview' | 'error'

interface AiImportState {
  phase: AiImportPhase
  result: ExtractedPerson[]
  errorMessage: string | null
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
      role: p.role,
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
    phase: 'idle',
    result: [],
    errorMessage: null,
  })

  const llmStore = useLlmSettingsStore()
  const locale = useLocaleStore((s) => s.locale)
  const mergePersonNodes = useOrgStore((s) => s.mergePersonNodes)
  const replaceWithPersonNodes = useOrgStore((s) => s.replaceWithPersonNodes)
  const applyAutoLayout = useOrgStore((s) => s.applyAutoLayout)

  const analyze = useCallback(
    async (base64: string, mimeType: string) => {
      setState({ phase: 'loading', result: [], errorMessage: null })
      try {
        const persons = await importGraphFromImage(base64, mimeType, {
          provider: llmStore.provider,
          openai: llmStore.openai,
          bedrock: llmStore.bedrock,
          azureOpenai: llmStore.azureOpenai,
        })
        setState({ phase: 'preview', result: persons, errorMessage: null })
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Unknown error occurred'
        // Network/CORS error
        if (message === 'Failed to fetch' || message.includes('NetworkError')) {
          message =
            'ネットワークエラーが発生しました。インターネット接続を確認してください。(Network error — check your connection)'
        }
        setState({ phase: 'error', result: [], errorMessage: message })
      }
    },
    [llmStore],
  )

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
      setState({ phase: 'idle', result: [], errorMessage: null })
    },
    [mergePersonNodes, replaceWithPersonNodes, applyAutoLayout, locale],
  )

  const reset = useCallback(() => {
    setState({ phase: 'idle', result: [], errorMessage: null })
  }, [])

  return {
    phase: state.phase,
    result: state.result,
    errorMessage: state.errorMessage,
    analyze,
    applyToChart,
    reset,
  }
}
