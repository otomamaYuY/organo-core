import { useState } from 'react'
import { Users, Building2 } from 'lucide-react'
import { useT } from '@/hooks/useT'

export type GenerateNodeKind = 'person' | 'org-unit'

interface GenerateMembersDialogProps {
  unitName: string
  suggestedCount: number
  existingCount: number
  kind: GenerateNodeKind
  onConfirm: (count: number) => void
  onSkip: () => void
}

export function GenerateMembersDialog({
  unitName,
  suggestedCount,
  existingCount,
  kind,
  onConfirm,
  onSkip,
}: GenerateMembersDialogProps) {
  const t = useT()
  const [count, setCount] = useState(suggestedCount)

  const descKey = kind === 'person' ? 'generateMembersDescPerson' : 'generateMembersDescUnit'
  const desc = t(descKey)
    .replace('{{unit}}', unitName)
    .replace('{{count}}', String(count))

  const existingNote = existingCount > 0
    ? t('generateMembersExisting').replace('{{existing}}', String(existingCount))
    : null

  const Icon = kind === 'person' ? Users : Building2

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onSkip}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          width: 360,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={15} color="var(--accent)" />
          </div>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>
            {t('generateMembersTitle')}
          </div>
        </div>

        {/* Description */}
        <div style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6, marginBottom: existingNote ? 4 : 16 }}>
          {desc}
        </div>
        {existingNote && (
          <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 16 }}>
            {existingNote}
          </div>
        )}

        {/* Count stepper */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            {t('generateMembersCount')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setCount((c) => Math.max(1, c - 1))} style={stepperBtnStyle}>
              −
            </button>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 1 && v <= 100) setCount(v)
              }}
              style={{ width: 64, textAlign: 'center', fontWeight: 600, fontSize: 15 }}
            />
            <button onClick={() => setCount((c) => Math.min(100, c + 1))} style={stepperBtnStyle}>
              ＋
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onConfirm(count)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 7,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon size={13} />
            {t('generateMembersConfirm')}
          </button>
          <button
            onClick={onSkip}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-2)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t('generateMembersSkip')}
          </button>
        </div>
      </div>
    </div>
  )
}

const stepperBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}
