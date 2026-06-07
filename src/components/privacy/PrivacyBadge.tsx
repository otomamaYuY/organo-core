import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { PrivacyCenterModal } from './PrivacyCenterModal'

export function PrivacyBadge() {
  const t = useT()
  const [showModal, setShowModal] = useState(false)

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
        <ShieldCheck size={13} strokeWidth={2.5} />
        {t('privacyBadgeOffline')}
        {/* Static green dot indicating zero external communication */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22c55e',
            flexShrink: 0,
          }}
        />
      </button>

      {showModal && <PrivacyCenterModal onClose={() => setShowModal(false)} />}
    </>
  )
}
