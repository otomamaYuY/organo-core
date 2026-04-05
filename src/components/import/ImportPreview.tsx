import { useState } from 'react'
import { Trash2, ChevronRight, Bot } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { ExtractedPerson } from '@/services/llm'

interface ImportPreviewProps {
  persons: ExtractedPerson[]
  onApply: (persons: ExtractedPerson[], mode: 'append' | 'replace') => void
  onBack: () => void
}

export function ImportPreview({ persons: initial, onApply, onBack }: ImportPreviewProps) {
  const t = useT()
  const [rows, setRows] = useState<ExtractedPerson[]>(initial)

  const updateRow = (index: number, patch: Partial<ExtractedPerson>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const deleteRow = (index: number) => {
    setRows((prev) => {
      const deleted = prev[index]
      // Re-parent children of deleted row to grandparent
      return prev
        .filter((_, i) => i !== index)
        .map((r) =>
          r.parentId === deleted.id ? { ...r, parentId: deleted.parentId } : r,
        )
    })
  }

  const handleApply = (mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      if (!window.confirm(t('previewReplaceConfirm'))) return
    }
    onApply(rows, mode)
  }

  const countLabel = t('previewCount').replace('{{count}}', String(rows.length))

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 24,
        width: 700,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <Bot size={15} color="var(--accent)" />
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
            {t('previewTitle')}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 11,
              color: 'var(--accent-text)',
              fontWeight: 600,
            }}
          >
            {countLabel}
          </span>
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{t('previewSubtitle')}</div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {[
                t('previewColName'),
                t('previewColRole'),
                t('previewColDept'),
                t('previewColParent'),
                t('previewColDelete'),
              ].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '6px 8px',
                    textAlign: 'left',
                    color: 'var(--text-3)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--surface)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface-2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                {/* Name */}
                <td style={tdStyle}>
                  <InlineInput
                    value={row.name}
                    onChange={(v) => updateRow(i, { name: v })}
                    required
                  />
                </td>
                {/* Role */}
                <td style={tdStyle}>
                  <InlineInput
                    value={row.role}
                    onChange={(v) => updateRow(i, { role: v })}
                    required
                  />
                </td>
                {/* Department */}
                <td style={tdStyle}>
                  <InlineInput
                    value={row.department ?? ''}
                    onChange={(v) => updateRow(i, { department: v || null })}
                  />
                </td>
                {/* Parent */}
                <td style={tdStyle}>
                  <ParentSelect
                    value={row.parentId}
                    currentId={row.id}
                    options={rows}
                    onChange={(v) => updateRow(i, { parentId: v })}
                    noneLabel={t('previewNone')}
                  />
                </td>
                {/* Delete */}
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => deleteRow(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onBack} style={backBtnStyle}>
          {t('previewBack')}
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => handleApply('replace')}
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text-2)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          {t('previewReplace')}
        </button>
        <button
          disabled={rows.length === 0}
          onClick={() => handleApply('append')}
          style={{
            height: 34,
            padding: '0 16px',
            borderRadius: 7,
            border: 'none',
            background: rows.length > 0 ? 'var(--accent)' : 'var(--surface-3)',
            color: rows.length > 0 ? '#fff' : 'var(--text-3)',
            fontSize: 13,
            fontWeight: 600,
            cursor: rows.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          {t('previewApply')}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function InlineInput({
  value,
  onChange,
  required = false,
}: {
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      style={{
        width: '100%',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 4,
        padding: '3px 6px',
        color: 'var(--text)',
        fontSize: 12,
        outline: 'none',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--surface-2)'
        e.currentTarget.style.borderColor = 'var(--accent)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    />
  )
}

function ParentSelect({
  value,
  currentId,
  options,
  onChange,
  noneLabel,
}: {
  value: string | null | undefined
  currentId: string
  options: ExtractedPerson[]
  onChange: (v: string | null) => void
  noneLabel: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        width: '100%',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '3px 6px',
        color: 'var(--text)',
        fontSize: 12,
        height: 26,
      }}
    >
      <option value="">{noneLabel}</option>
      {options
        .filter((o) => o.id !== currentId)
        .map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} ({o.role})
          </option>
        ))}
    </select>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '5px 8px',
  verticalAlign: 'middle',
}

const backBtnStyle: React.CSSProperties = {
  height: 34,
  padding: '0 12px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'none',
  color: 'var(--text-3)',
  fontSize: 12,
  cursor: 'pointer',
}
