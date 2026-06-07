import { useState } from 'react'
import { ShieldCheck, Radio } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useNetworkStore } from '@/store/useNetworkStore'
import { PrivacyCenterModal } from './PrivacyCenterModal'

export function PrivacyBadge() {
  const t = useT()
  const [showModal, setShowModal] = useState(false)
  const isSending = useNetworkStore(s => s.activeCount > 0)

  const dotColor = isSending ? 'var(--warning, #f59e0b)' : '#22c55e'
  const label = isSending ? t('privacyBadgeSending') : t('privacyBadgeOffline')

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={t('privacyBadgeTooltip')}
        data-tooltip={t('privacyBadgeTooltip')}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 9px',
          height: 34,
          borderRadius: 7,
          border: '1px solid var(--accent-border)',
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent-bg)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
      >
        {isSending
          ? <Radio size={13} strokeWidth={2.5} />
          : <ShieldCheck size={13} strokeWidth={2.5} />
        }
        {label}
        {/* Live dot: green = offline, amber = sending to OpenAI */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            transition: 'background 0.3s',
            ...(isSending && {
              boxShadow: `0 0 0 2px var(--warning, #f59e0b)44`,
            }),
          }}
        />
      </button>

      {showModal && <PrivacyCenterModal onClose={() => setShowModal(false)} />}
    </>
  )
}
