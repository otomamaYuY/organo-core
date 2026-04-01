import { HelpCircle } from 'lucide-react'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useT } from '@/hooks/useT'

export function HelpButton() {
  const startTour = useOnboardingStore(s => s.startTour)
  const t = useT()

  return (
    <button
      onClick={startTour}
      data-tooltip={t('helpBtnLabel')}
      title={t('helpBtnLabel')}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--accent)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 50,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <HelpCircle size={22} color="#fff" />
    </button>
  )
}
