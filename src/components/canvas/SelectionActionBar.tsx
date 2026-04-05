import { Trash2, Move } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'

export function SelectionActionBar() {
  const { nodes, edges, deleteSelected } = useOrgStore()
  const t = useT()

  const selectedNodes = nodes.filter(n => n.selected)
  const selectedEdges = edges.filter(e => e.selected)
  const total = selectedNodes.length + selectedEdges.length

  if (total === 0) return null

  const label = [
    selectedNodes.length > 0 && t('selectionNodes').replace('{{n}}', String(selectedNodes.length)),
    selectedEdges.length > 0 && t('selectionEdges').replace('{{n}}', String(selectedEdges.length)),
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 14px',
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <Move size={13} color="var(--text-3)" />
      <span style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{t('selectionHint')}</span>
      <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
      <button
        onClick={deleteSelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 6,
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--danger)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Trash2 size={12} />
        {t('delete')}
      </button>
    </div>
  )
}
