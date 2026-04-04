import { useState, useRef, useEffect } from 'react'
import { HelpCircle, PlayCircle, GitBranch, MessageSquare, BookOpen } from 'lucide-react'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useT } from '@/hooks/useT'

const REPO = 'https://github.com/otomamaYuY/organo-core'

const LINKS = [
  { Icon: GitBranch,     label: 'GitHub',           href: REPO },
  { Icon: MessageSquare, label: 'Issue / Feedback',  href: `${REPO}/issues` },
  { Icon: BookOpen,      label: 'Changelog',         href: `${REPO}/releases` },
]

export function HelpButton() {
  const startTour = useOnboardingStore(s => s.startTour)
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleTour = () => {
    setOpen(false)
    startTour()
  }

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      {/* Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            right: 0,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            padding: '6px 0',
            minWidth: 180,
            animation: 'helpPopIn 0.15s ease',
          }}
        >
          <MenuItem Icon={PlayCircle} label={t('helpBtnLabel')} onClick={handleTour} />
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          {LINKS.map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <MenuItem Icon={Icon} label={label} />
            </a>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title={t('helpBtnLabel')}
        style={{
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
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <HelpCircle size={22} color="#fff" />
      </button>

      <style>{`
        @keyframes helpPopIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function MenuItem({
  Icon,
  label,
  onClick,
}: {
  Icon: React.ElementType
  label: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        fontSize: 13,
        color: hovered ? 'var(--text)' : 'var(--text-2)',
        background: hovered ? 'var(--surface-2)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </div>
  )
}
