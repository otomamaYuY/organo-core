import {
  Download,
  Upload,
  LayoutDashboard,
  UserPlus,
  Building2,
  Sun,
  Moon,
  FilePlus,
} from 'lucide-react'
import { SearchBar } from './SearchBar'
import { SaveStatus } from './SaveStatus'
import { useRef, useState } from 'react'
import { ExportModal } from '@/components/export/ExportModal'
import { useOrgStore } from '@/store/useOrgStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useLocaleStore } from '@/store/useLocaleStore'
import { useT } from '@/hooks/useT'

export function Toolbar() {
  const [showExport, setShowExport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyAutoLayout = useOrgStore(s => s.applyAutoLayout)
  const importFromJson = useOrgStore(s => s.importFromJson)
  const addPersonNode = useOrgStore(s => s.addPersonNode)
  const addUnitNode = useOrgStore(s => s.addUnitNode)
  const resetToDefault = useOrgStore(s => s.resetToDefault)

  const { theme, toggleTheme } = useThemeStore()
  const { locale, toggleLocale } = useLocaleStore()
  const t = useT()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importFromJson(JSON.parse(ev.target?.result as string))
      } catch {
        alert(t('importError'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <div
        data-tour="toolbar"
        style={{
          height: 52,
          background: 'var(--panel-bg)',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <SearchBar />

        <Divider />

        <ToolbarBtn
          onClick={applyAutoLayout}
          title={t('autoLayout')}
          tooltip={t('tooltipAutoLayout')}
        >
          <LayoutDashboard size={14} />
          {t('autoLayout')}
        </ToolbarBtn>

        <ToolbarBtn
          data-testid="btn-export"
          data-tour="btn-export"
          onClick={() => setShowExport(true)}
          title={t('exportBtn')}
          tooltip={t('tooltipExport')}
        >
          <Download size={14} />
          {t('exportBtn')}
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title={t('importBtn')}
          tooltip={t('tooltipImport')}
        >
          <Upload size={14} />
          {t('importBtn')}
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => {
            if (window.confirm(t('newChartConfirm'))) resetToDefault()
          }}
          title={t('newChart')}
          tooltip={t('tooltipNew')}
        >
          <FilePlus size={15} />
          {t('newChart')}
        </ToolbarBtn>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Divider />

        <ToolbarBtn
          data-testid="btn-add-person"
          data-tour="btn-add-person"
          onClick={() => addPersonNode()}
          title={t('addPerson')}
          accent
          tooltip={t('tooltipAddPerson')}
        >
          <UserPlus size={14} />
          {t('addPerson')}
        </ToolbarBtn>

        <ToolbarBtn
          data-testid="btn-add-unit"
          onClick={() => addUnitNode()}
          title={t('addUnit')}
          accent
          tooltip={t('tooltipAddUnit')}
        >
          <Building2 size={14} />
          {t('addUnit')}
        </ToolbarBtn>

        <div style={{ flex: 1 }} />

        <SaveStatus />

        {/* Language toggle */}
        <IconBtn
          onClick={toggleLocale}
          title={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
          tooltip={t('tooltipLang')}
        >
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {locale === 'ja' ? 'EN' : 'JP'}
          </span>
        </IconBtn>

        {/* Theme toggle */}
        <IconBtn
          onClick={toggleTheme}
          title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
          tooltip={t('tooltipTheme')}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </IconBtn>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  )
}

function Divider() {
  return (
    <div
      style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }}
    />
  )
}

function ToolbarBtn({
  children,
  onClick,
  title,
  accent = false,
  tooltip,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  accent?: boolean
  tooltip?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-tooltip={tooltip}
      {...rest}
      style={{
        position: 'relative',
        background: accent ? 'var(--accent-bg)' : 'var(--surface-2)',
        border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 7,
        padding: '0 10px',
        height: 34,
        lineHeight: 1,
        cursor: 'pointer',
        color: accent ? 'var(--accent-text)' : 'var(--text-2)',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: 112,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = accent ? 'var(--accent-bg)' : 'var(--surface-3)'
        e.currentTarget.style.color = accent ? 'var(--accent)' : 'var(--text)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = accent ? 'var(--accent-bg)' : 'var(--surface-2)'
        e.currentTarget.style.color = accent ? 'var(--accent-text)' : 'var(--text-2)'
      }}
    >
      {children}
    </button>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  tooltip,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  tooltip?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-tooltip={tooltip}
      style={{
        position: 'relative',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        width: 34,
        height: 34,
        cursor: 'pointer',
        color: 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--surface-3)'
        e.currentTarget.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--surface-2)'
        e.currentTarget.style.color = 'var(--text-2)'
      }}
    >
      {children}
    </button>
  )
}
