import { Building2, UserPlus } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'

export function EmptyState() {
  const { addPersonNode, addUnitNode } = useOrgStore()
  const t = useT()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          background: 'var(--panel-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 16,
          padding: '32px 40px',
          pointerEvents: 'auto',
        }}
      >
        <Building2 size={40} color="var(--text-3)" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>
            {t('emptyStateTitle')}
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
            {t('emptyStateSubtitle')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => addPersonNode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={14} />
            {t('emptyStateAddPerson')}
          </button>
          <button
            onClick={() => addUnitNode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Building2 size={14} />
            {t('emptyStateAddUnit')}
          </button>
        </div>
      </div>
    </div>
  )
}
