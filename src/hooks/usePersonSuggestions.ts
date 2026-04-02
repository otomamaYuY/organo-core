import { useOrgStore } from '@/store/useOrgStore'
import type { OrgPersonData } from '@/types'

/**
 * Collects unique role, department, and tag values already used by other
 * person nodes in the org chart. Used to power autocomplete suggestions
 * in PersonEditForm.
 *
 * @param excludeNodeId - the node currently being edited (excluded from results)
 */
export function usePersonSuggestions(excludeNodeId: string) {
  const nodes = useOrgStore(s => s.nodes)

  const personData = nodes
    .filter(n => n.id !== excludeNodeId && n.data.kind === 'person')
    .map(n => n.data as OrgPersonData)

  const roles = [...new Set(personData.map(p => p.role).filter(Boolean))].sort()
  const departments = [
    ...new Set(personData.map(p => p.department).filter(Boolean)),
  ].sort()
  const tags = [
    ...new Set(personData.flatMap(p => p.tags ?? []).filter(Boolean)),
  ].sort()

  return { roles, departments, tags }
}
