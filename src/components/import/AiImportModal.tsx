import { useState, useCallback, useEffect, useRef } from 'react'
import { X, ImagePlus, Clipboard, AlertCircle, Bot } from 'lucide-react'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/translations'
import { useLlmSettingsStore } from '@/store/useLlmSettingsStore'
import { LlmSettingsModal } from '@/components/settings/LlmSettingsModal'
import type { AiImportPhase } from '@/hooks/useAiImport'
import type { ExtractedPerson } from '@/services/llm'

interface AiImportModalProps {
  onClose: () => void
  phase: AiImportPhase
  errorMessage: string | null
  onAnalyze: (base64: string, mimeType: string) => void
  onReset: () => void
  /** Rendered by parent when phase === 'preview' */
  previewSlot?: React.ReactNode
}

export function AiImportModal({
  onClose,
  phase,
  errorMessage,
  onAnalyze,
  onReset,
  previewSlot,
}: AiImportModalProps) {
  const t = useT()
  const isConfigured = useLlmSettingsStore((s) => s.isConfigured)
  const [showSettings, setShowSettings] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/png')
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE_MB = 20

  const processFile = useCallback((file: File) => {
    setValidationError(null)
    if (!file.type.startsWith('image/')) {
      setValidationError(t('aiImportInvalidType'))
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setValidationError(t('aiImportTooLarge').replace('{{mb}}', String(MAX_FILE_SIZE_MB)))
      return
    }
    setMimeType(file.type)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }, [t])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) processFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [processFile])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleAnalyzeClick = () => {
    if (!preview) return
    const base64 = preview.split(',')[1]
    onAnalyze(base64, mimeType)
  }

  const handleClose = () => {
    onReset()
    onClose()
  }

  // ── Unconfigured screen ──────────────────────────────────────────
  if (!isConfigured()) {
    return (
      <>
        <Backdrop onClick={handleClose}>
          <Panel width={360} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ marginBottom: 12, color: 'var(--accent)' }}><Bot size={36} /></div>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                {t('aiImportTitle')}
              </div>
              <div
                style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}
              >
                {t('aiImportNeedsConfig')}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <ActionBtn variant="accent" onClick={() => setShowSettings(true)}>
                  {t('aiImportGoToSettings')}
                </ActionBtn>
                <ActionBtn variant="default" onClick={handleClose}>
                  {t('settingsCancel')}
                </ActionBtn>
              </div>
            </div>
          </Panel>
        </Backdrop>
        {showSettings && <LlmSettingsModal onClose={() => setShowSettings(false)} />}
      </>
    )
  }

  // ── Loading screen ───────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <Backdrop onClick={() => {}}>
        <Panel width={360} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 16,
                color: 'var(--accent)',
              }}
            >
              <SpinnerIcon />
            </div>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
              {t('aiImportAnalyzing')}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{t('aiImportAnalyzingHint')}</div>
          </div>
        </Panel>
      </Backdrop>
    )
  }

  // ── Error screen ─────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <Backdrop onClick={handleClose}>
        <Panel width={420} onClick={(e) => e.stopPropagation()}>
          <ModalHeader title={t('aiImportTitle')} onClose={handleClose} />
          <div
            style={{
              padding: '16px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 8,
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ color: 'var(--danger)', fontSize: 13, lineHeight: 1.5 }}>
              {errorMessage}
            </div>
          </div>
          <ActionBtn variant="default" onClick={() => { onReset(); setPreview(null) }}>
            {t('aiImportRetry')}
          </ActionBtn>
        </Panel>
      </Backdrop>
    )
  }

  // ── Preview screen (rendered by parent via slot) ──────────────────
  if (phase === 'preview' && previewSlot) {
    return (
      <Backdrop onClick={handleClose}>
        <div onClick={(e) => e.stopPropagation()}>{previewSlot}</div>
      </Backdrop>
    )
  }

  // ── Image selection screen (idle) ────────────────────────────────
  return (
    <Backdrop onClick={handleClose}>
      <Panel width={480} onClick={(e) => e.stopPropagation()}>
        <ModalHeader title={t('aiImportTitle')} onClose={handleClose} />

        <DropZone
          preview={preview}
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !preview && fileInputRef.current?.click()}
          onClearPreview={() => { setPreview(null); setValidationError(null) }}
          t={t}
        />

        {validationError && (
          <div
            style={{
              marginTop: 8,
              padding: '7px 12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 6,
              color: 'var(--danger)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={13} />
            {validationError}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            disabled={!preview}
            onClick={handleAnalyzeClick}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 7,
              border: 'none',
              background: preview ? 'var(--accent)' : 'var(--surface-3)',
              color: preview ? '#fff' : 'var(--text-3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: preview ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {t('aiImportAnalyze')}
          </button>
          <ActionBtn variant="default" onClick={handleClose}>
            {t('settingsCancel')}
          </ActionBtn>
        </div>
      </Panel>
    </Backdrop>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Backdrop({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
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
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function Panel({
  children,
  width,
  onClick,
}: {
  children: React.ReactNode
  width: number
  onClick?: React.MouseEventHandler
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 24,
        width,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {children}
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <div
        style={{
          color: 'var(--text)',
          fontWeight: 700,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Bot size={15} color="var(--accent)" />
        {title}
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
  )
}

function DropZone({
  preview,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onClearPreview,
  t,
}: {
  preview: string | null
  isDragging: boolean
  onDragOver: React.DragEventHandler
  onDragLeave: React.DragEventHandler
  onDrop: React.DragEventHandler
  onClick: () => void
  onClearPreview: () => void
  t: (key: TranslationKey) => string
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      style={{
        border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 24,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDragging ? 'var(--accent-bg)' : 'var(--surface-2)',
        cursor: preview ? 'default' : 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 6, objectFit: 'contain' }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onClearPreview() }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            {t('aiImportChangeImage')}
          </button>
        </>
      ) : (
        <>
          <div style={{ color: 'var(--accent)', marginBottom: 12 }}>
            <ImagePlus size={36} />
          </div>
          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            {t('aiImportDropHere')}
          </div>
          <div
            style={{
              color: 'var(--text-3)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Clipboard size={11} />
            {t('aiImportPasteHint')}
          </div>
        </>
      )}
    </div>
  )
}

function ActionBtn({
  children,
  variant,
  onClick,
}: {
  children: React.ReactNode
  variant: 'accent' | 'default' | 'danger'
  onClick: () => void
}) {
  const styles: Record<string, React.CSSProperties> = {
    accent: {
      background: 'var(--accent)',
      border: 'none',
      color: '#fff',
    },
    default: {
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      color: 'var(--text-2)',
    },
    danger: {
      background: 'var(--danger-bg)',
      border: '1px solid var(--danger-border)',
      color: 'var(--danger)',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        borderRadius: 7,
        padding: '0 16px',
        height: 34,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function SpinnerIcon() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid var(--surface-3)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('ai-import-spin')) {
  const style = document.createElement('style')
  style.id = 'ai-import-spin'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}

// Re-export for parent use
export type { ExtractedPerson }
