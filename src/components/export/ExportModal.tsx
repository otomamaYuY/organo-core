import { X, FileJson, FileImage, FileType, File, GitBranch, Sheet, Globe } from 'lucide-react'
import { useExport } from '@/hooks/useExport'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'

interface ExportModalProps {
  onClose: () => void
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { exportToPng, exportToSvg, exportToPdf, exportToTreeJson, exportToFlatCsv, exportToHtml } =
    useExport()
  const exportToJson = useOrgStore(s => s.exportToJson)
  const t = useT()

  const options = [
    {
      icon: <FileJson size={20} />,
      label: 'JSON',
      desc: t('jsonDesc'),
      action: () => {
        exportToJson()
        onClose()
      },
    },
    {
      icon: <GitBranch size={20} />,
      label: 'JSON Tree',
      desc: t('treeJsonDesc'),
      action: () => {
        exportToTreeJson()
        onClose()
      },
    },
    {
      icon: <Sheet size={20} />,
      label: 'CSV',
      desc: t('flatCsvDesc'),
      action: () => {
        exportToFlatCsv()
        onClose()
      },
    },
    {
      icon: <Globe size={20} />,
      label: 'HTML',
      desc: t('standaloneHtmlDesc'),
      action: () => {
        exportToHtml()
        onClose()
      },
    },
    {
      icon: <FileImage size={20} />,
      label: 'PNG',
      desc: t('pngDesc'),
      action: () => exportToPng().then(onClose),
    },
    {
      icon: <FileType size={20} />,
      label: 'SVG',
      desc: t('svgDesc'),
      action: () => exportToSvg().then(onClose),
    },
    {
      icon: <File size={20} />,
      label: 'PDF',
      desc: t('pdfDesc'),
      action: () => exportToPdf().then(onClose),
    },
  ]

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
      onClick={onClose}
    >
      <div
        data-testid="export-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          width: 360,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
            {t('exportTitle')}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map(opt => (
            <button
              key={opt.label}
              data-testid={`export-${opt.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={opt.action}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                padding: '13px 11px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-3)'
                e.currentTarget.style.borderColor = 'var(--accent-border)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div style={{ color: 'var(--accent)', marginBottom: 6 }}>{opt.icon}</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
