import { Trash2 } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { PersonEditForm } from './PersonEditForm'
import { UnitEditForm } from './UnitEditForm'
import type { OrgNodeData, OrgPersonData, OrgUnitData } from '@/types'
import { useT } from '@/hooks/useT'

export function Sidebar() {
  const { nodes, selectedNodeId, updateNode, deleteNode } = useOrgStore()
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const visible = !!selectedNode
  const t = useT()

  return (
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
                data={selectedNode.data as OrgPersonData}
                onSave={values => updateNode(selectedNode.id, values as Partial<OrgNodeData>)}
              />
            ) : (
              <UnitEditForm
                data={selectedNode.data as OrgUnitData}
                onSave={values => updateNode(selectedNode.id, values as Partial<OrgNodeData>)}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
