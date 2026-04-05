import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/store/useToastStore'

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; color: string; icon: React.ReactNode }
> = {
  success: {
    bg: 'var(--success-bg)',
    border: 'var(--success)',
    color: 'var(--success)',
    icon: <CheckCircle size={15} />,
  },
  error: {
    bg: 'var(--danger-bg)',
    border: 'var(--danger-border)',
    color: 'var(--danger)',
    icon: <AlertCircle size={15} />,
  },
  warn: {
    bg: 'var(--warn-bg)',
    border: 'var(--warn)',
    color: 'var(--warn)',
    icon: <AlertTriangle size={15} />,
  },
  info: {
    bg: 'var(--accent-bg)',
    border: 'var(--accent-border)',
    color: 'var(--accent-text)',
    icon: <Info size={15} />,
  },
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => {
        const s = VARIANT_STYLES[t.variant]
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--surface)',
              border: `1px solid ${s.border}`,
              borderLeft: `3px solid ${s.border}`,
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              animation: 'toast-in 0.2s ease',
            }}
          >
            <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <span
              style={{
                flex: 1,
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)',
                display: 'flex',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
