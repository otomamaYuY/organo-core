import { Check, Circle } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useSaveStatusStore } from '@/hooks/useAutoSave'
import { useT } from '@/hooks/useT'

export function SaveStatus() {
  const isDirty = useOrgStore(s => s.isDirty)
  const lastSaved = useSaveStatusStore(s => s.lastSaved)
  const t = useT()

  // Don't show anything on first load with no saves yet
  if (!isDirty && lastSaved === null) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: isDirty ? 'var(--warn, #f59e0b)' : 'var(--text-3)',
        whiteSpace: 'nowrap',
        padding: '0 8px',
      }}
    >
      {isDirty ? (
        <>
          <Circle size={8} fill="currentColor" />
          {t('unsaved')}
        </>
      ) : (
        <>
          <Check size={12} />
          {t('saved')}
        </>
      )}
    </div>
  )
}
