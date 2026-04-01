import { useEffect, useRef } from 'react'
import { useReactFlow } from 'reactflow'
import { User, Building2 } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'

export function QuickNodeCreationMenu() {
  const { quickCreateMenu, setQuickCreateMenu, addPersonNode, addUnitNode } = useOrgStore()
  const { screenToFlowPosition } = useReactFlow()
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => {
    if (!quickCreateMenu.visible) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setQuickCreateMenu({ visible: false, x: 0, y: 0, sourceNodeId: null })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [quickCreateMenu.visible, setQuickCreateMenu])

  if (!quickCreateMenu.visible) return null

  const MENU_W = 165
  const MENU_H = 112 // header + 2 buttons
  const x = Math.min(Math.max(quickCreateMenu.x, 8), window.innerWidth - MENU_W - 8)
  const y = Math.min(Math.max(quickCreateMenu.y, 8), window.innerHeight - MENU_H - 8)

  const handleCreate = (type: 'person' | 'unit') => {
    const position = screenToFlowPosition({ x: quickCreateMenu.x, y: quickCreateMenu.y })
    const sourceId = quickCreateMenu.sourceNodeId || undefined
    if (type === 'person') addPersonNode(sourceId, position)
    else addUnitNode(sourceId, position)
    setQuickCreateMenu({ visible: false, x: 0, y: 0, sourceNodeId: null })
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        background: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        minWidth: 155,
      }}
    >
      <div
        style={{
          padding: '8px 12px 4px',
          color: 'var(--text-3)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {t('createNode')}
      </div>
      <div style={{ padding: '4px 6px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <QuickBtn
          icon={<User size={13} />}
          label={t('quickPerson')}
          onClick={() => handleCreate('person')}
        />
        <QuickBtn
          icon={<Building2 size={13} />}
          label={t('quickUnit')}
          onClick={() => handleCreate('unit')}
        />
      </div>
    </div>
  )
}

function QuickBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        width: '100%',
        padding: '8px 10px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        color: 'var(--text-2)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--accent-bg)'
        e.currentTarget.style.color = 'var(--accent)'
        e.currentTarget.style.borderColor = 'var(--accent-border)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--surface-2)'
        e.currentTarget.style.color = 'var(--text-2)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
