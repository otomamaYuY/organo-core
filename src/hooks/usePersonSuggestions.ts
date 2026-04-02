import { useOrgStore } from '@/store/useOrgStore'
import type { OrgPersonData, OrgUnitData } from '@/types'

/**
 * Collects unique role, department, and tag values already used by other
 * person nodes in the org chart. Department suggestions also include the
 * unitName of every org-unit node present in the chart.
 *
 * @param excludeNodeId - the node currently being edited (excluded from results)
 */
export function usePersonSuggestions(excludeNodeId: string) {
  const nodes = useOrgStore(s => s.nodes)

  const personData = nodes
    .filter(n => n.id !== excludeNodeId && n.data.kind === 'person')
    .map(n => n.data as OrgPersonData)

  const unitNames = nodes
    .filter(n => n.data.kind === 'org-unit')
    .map(n => (n.data as OrgUnitData).unitName)
    .filter(Boolean)

  const roles = [...new Set(personData.map(p => p.role).filter(Boolean))].sort()
  const departments = [
    ...new Set([
      ...personData.map(p => p.department).filter(Boolean),
      ...unitNames,
    ]),
  ].sort()
  const tags = [
    ...new Set(personData.flatMap(p => p.tags ?? []).filter(Boolean)),
  ].sort()

  return { roles, departments, tags }
}
