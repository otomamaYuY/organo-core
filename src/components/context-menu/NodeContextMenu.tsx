import { useEffect, useRef } from 'react'
import { UserPlus, Building2, Edit3, Trash2, ChevronDown } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'

const MENU_W = 200
const MENU_H = 200

export function NodeContextMenu() {
  const {
    contextMenu,
    setContextMenu,
    addPersonNode,
    addUnitNode,
    deleteNode,
    toggleCollapse,
    selectNode,
    nodes,
  } = useOrgStore()
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setContextMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setContextMenu])

  if (!contextMenu) return null

  const node = nodes.find(n => n.id === contextMenu.nodeId)
  if (!node) return null

  const isCollapsed = node.data.isCollapsed ?? false
  const x = Math.min(contextMenu.x, window.innerWidth - MENU_W - 8)
  const y = Math.min(contextMenu.y, window.innerHeight - MENU_H - 8)

  const menuItems = [
    {
      icon: <UserPlus size={13} />,
      label: t('addPersonBelow'),
      testId: 'ctx-add-person',
      onClick: () => {
        addPersonNode(contextMenu.nodeId)
        setContextMenu(null)
      },
    },
    {
      icon: <Building2 size={13} />,
      label: t('addUnitBelow'),
      testId: 'ctx-add-unit',
      onClick: () => {
        addUnitNode(contextMenu.nodeId)
        setContextMenu(null)
      },
    },
    {
      icon: <Edit3 size={13} />,
      label: t('menuEdit'),
      testId: 'ctx-edit',
      onClick: () => {
        selectNode(contextMenu.nodeId)
        setContextMenu(null)
      },
    },
    {
      icon: (
        <ChevronDown
          size={13}
          style={{
            transform: isCollapsed ? 'rotate(-90deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      ),
      label: isCollapsed ? t('menuExpand') : t('menuCollapse'),
      testId: 'ctx-collapse',
      onClick: () => {
        toggleCollapse(contextMenu.nodeId)
        setContextMenu(null)
      },
    },
    {
      icon: <Trash2 size={13} />,
      label: t('menuDelete'),
      testId: 'ctx-delete',
      onClick: () => {
        deleteNode(contextMenu.nodeId)
        setContextMenu(null)
      },
      danger: true,
    },
  ]

  return (
    <div
      data-testid="context-menu"
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        background: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        borderRadius: 9,
        padding: '5px 0',
        minWidth: 190,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {menuItems.map((item, i) => (
        <button
          key={i}
          data-testid={item.testId}
          onClick={item.onClick}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '8px 13px',
            cursor: 'pointer',
            color: item.danger ? 'var(--danger)' : 'var(--text-2)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            textAlign: 'left',
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = item.danger ? 'var(--danger-bg)' : 'var(--surface-2)'
            e.currentTarget.style.color = item.danger ? 'var(--danger)' : 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = item.danger ? 'var(--danger)' : 'var(--text-2)'
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
