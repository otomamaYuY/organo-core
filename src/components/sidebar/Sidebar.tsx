import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { PersonEditForm } from './PersonEditForm'
import { UnitEditForm } from './UnitEditForm'
import { GenerateMembersDialog, type GenerateNodeKind } from './GenerateMembersDialog'
import { toast } from '@/store/useToastStore'
import type { OrgNodeData, OrgPersonData, OrgUnitData } from '@/types'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/useLocaleStore'

interface PendingGenerate {
  unitId: string
  unitName: string
  count: number
  existingCount: number
  kind: GenerateNodeKind
}

export function Sidebar() {
  const { nodes, edges, selectedNodeId, updateNode, deleteNode, addPersonNode, insertPersonAboveNode, addUnitNode, applyAutoLayout, selectNode } = useOrgStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const visible = !!selectedNode
  const t = useT()
  const locale = useLocaleStore(s => s.locale)
  const [generateQueue, setGenerateQueue] = useState<PendingGenerate[]>([])
  const pendingGenerate = generateQueue[0] ?? null

  const handleUnitSave = (unitId: string, unitName: string, values: Partial<OrgNodeData>) => {
    updateNode(unitId, values)
    const unitData = values as OrgUnitData
    const memberCount = unitData.memberCount ?? 0
    const childUnitCount = unitData.childUnitCount ?? 0

    // headPersonName: insert a person node as the direct parent of this org unit (representing the head).
    // Read from getState() to get the latest store state, bypassing the stale React closure.
    const headName = unitData.headPersonName?.trim()
    if (headName) {
      const { nodes: n0, edges: e0 } = useOrgStore.getState()
      // Find the current parent of this unit (could be a person already placed there)
      const parentEdge = e0.find(e => e.target === unitId)
      const parentNode = parentEdge ? n0.find(n => n.id === parentEdge.source) : null
      const alreadyHeadAbove =
        parentNode?.data.kind === 'person' &&
        (parentNode.data as OrgPersonData).name === headName
      if (!alreadyHeadAbove) {
        insertPersonAboveNode(unitId, { name: headName })
      }
    }

    // Build a queue of all needed auto-generate dialogs.
    // Use getState() for fresh counts after updateNode.
    const { nodes: n1, edges: e1 } = useOrgStore.getState()
    const queue: PendingGenerate[] = []

    if (childUnitCount > 0) {
      const existingUnitChildren = e1.filter(e => {
        if (e.source !== unitId) return false
        const targetNode = n1.find(n => n.id === e.target)
        return targetNode?.data.kind === 'org-unit'
      }).length
      const toGenerate = Math.max(0, childUnitCount - existingUnitChildren)
      if (toGenerate > 0) {
        queue.push({ unitId, unitName, count: toGenerate, existingCount: existingUnitChildren, kind: 'org-unit' })
      }
    }

    if (memberCount > 0) {
      const existingPersonChildren = e1.filter(e => {
        if (e.source !== unitId) return false
        const targetNode = n1.find(n => n.id === e.target)
        return targetNode?.data.kind === 'person'
      }).length
      const toGenerate = Math.max(0, memberCount - existingPersonChildren)
      if (toGenerate > 0) {
        queue.push({ unitId, unitName, count: toGenerate, existingCount: existingPersonChildren, kind: 'person' })
      }
    }

    setGenerateQueue(queue)
  }

  const handleGenerateConfirm = (count: number) => {
    if (!pendingGenerate) return
    for (let i = 0; i < count; i++) {
      if (pendingGenerate.kind === 'person') {
        // memberCount was already set via the form save; skip auto-increment to avoid double-counting
        addPersonNode(pendingGenerate.unitId, undefined, undefined, false)
      } else {
        addUnitNode(pendingGenerate.unitId)
      }
    }
    applyAutoLayout()
    selectNode(pendingGenerate.unitId)
    toast.success(t('generateMembersToast').replace('{{count}}', String(count)))
    setGenerateQueue(q => q.slice(1))
  }

  const handleGenerateSkip = () => {
    setGenerateQueue(q => q.slice(1))
  }

  return (
    <>
    <div
      data-testid="sidebar"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 300,
        height: '100%',
        background: 'var(--panel-bg)',
        borderRight: '1px solid var(--panel-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {selectedNode && (
        <>
          <div
            style={{
              padding: '14px 14px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                color: 'var(--text-2)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              {selectedNode.data.kind === 'person' ? t('editPerson') : t('editUnit')}
            </div>
            <button
              data-testid="sidebar-delete-btn"
              onClick={() => deleteNode(selectedNode.id)}
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 6,
                padding: '4px 9px',
                cursor: 'pointer',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Trash2 size={12} />
              {t('delete')}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {selectedNode.data.kind === 'person' ? (
              <PersonEditForm
                key={`${selectedNode.id}-${locale}`}
                data={selectedNode.data as OrgPersonData}
                onSave={values => updateNode(selectedNode.id, values as Partial<OrgNodeData>)}
              />
            ) : (
              <UnitEditForm
                key={`${selectedNode.id}-${locale}`}
                data={selectedNode.data as OrgUnitData}
                onSave={values =>
                  handleUnitSave(
                    selectedNode.id,
                    (values as OrgUnitData).unitName || (selectedNode.data as OrgUnitData).unitName,
                    values as Partial<OrgNodeData>,
                  )
                }
              />
            )}
          </div>
        </>
      )}
    </div>

    {pendingGenerate && (
      <GenerateMembersDialog
        key={`${pendingGenerate.unitId}-${pendingGenerate.kind}`}
        unitName={pendingGenerate.unitName}
        suggestedCount={pendingGenerate.count}
        existingCount={pendingGenerate.existingCount}
        kind={pendingGenerate.kind}
        onConfirm={handleGenerateConfirm}
        onSkip={handleGenerateSkip}
      />
    )}
    </>
  )
}
