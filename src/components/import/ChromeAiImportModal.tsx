import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Bot, AlertCircle, Cpu, ExternalLink, CheckCircle, ImagePlus, Clipboard } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { importGraphFromText, type ExtractedPerson } from '@/services/llm'
import { analyzeImageWithChromeAI, getChromeAiAvailability, type ChromeAiAvailability } from '@/services/llm/chrome-ai'
import { useAiImport } from '@/hooks/useAiImport'
import { ImportPreview } from './ImportPreview'

interface ChromeAiImportModalProps {
  onClose: () => void
}

type Phase = 'idle' | 'loading' | 'preview' | 'error'
type Tab = 'text' | 'image'

const CHROME_AI_DOCS_URL = 'https://developer.chrome.com/docs/ai/built-in'
const MAX_IMAGE_MB = 20

export function ChromeAiImportModal({ onClose }: ChromeAiImportModalProps) {
  const t = useT()
  const { applyToChart } = useAiImport()

  const [phase, setPhase] = useState<Phase>('idle')
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [result, setResult] = useState<ExtractedPerson[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [availability, setAvailability] = useState<ChromeAiAvailability | 'checking'>('checking')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Image tab state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    getChromeAiAvailability().then(setAvailability)
  }, [])

  // Elapsed-time counter shown during loading so users know the model is working.
  useEffect(() => {
    if (phase !== 'loading') {
      setElapsedSeconds(0)
      return
    }
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }
  }, [])

  const processFile = useCallback((file: File) => {
    setImageError(null)
    if (!file.type.startsWith('image/')) {
      setImageError(t('aiImportInvalidType'))
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(t('aiImportTooLarge').replace('{{mb}}', String(MAX_IMAGE_MB)))
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setImageFile(file)
    setImagePreviewUrl(url)
  }, [t])

  // Clipboard paste → switch to image tab automatically
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { setTab('image'); processFile(file) }
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [processFile])

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return
    setPhase('loading')
    setErrorMessage(null)
    try {
      const persons = await importGraphFromText(text.trim())
      setResult(persons)
      setPhase('preview')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred')
      setPhase('error')
    }
  }, [text])

  const handleAnalyzeImage = useCallback(async () => {
    if (!imageFile) return
    setPhase('loading')
    setErrorMessage(null)
    try {
      const persons = await analyzeImageWithChromeAI(imageFile)
      setResult(persons)
      setPhase('preview')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred')
      setPhase('error')
    }
  }, [imageFile])

  const handleApply = useCallback(
    (persons: ExtractedPerson[], mode: 'append' | 'replace') => {
      applyToChart(persons, mode)
      onClose()
    },
    [applyToChart, onClose],
  )

  const handleClose = () => {
    onClose()
  }

  // ── Checking availability ───────────────────────────────
  if (availability === 'checking') {
    return (
      <Backdrop onClick={onClose}>
        <Panel width={360} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'var(--accent)' }}>
              <SpinnerIcon />
            </div>
          </div>
        </Panel>
      </Backdrop>
    )
  }

  // ── Setup required (unsupported / unavailable / downloadable / downloading) ──
  if (availability !== 'available') {
    const isDownloading = availability === 'downloading'
    const isDownloadable = availability === 'downloadable'

    return (
      <Backdrop onClick={onClose}>
        <Panel width={500} onClick={(e) => e.stopPropagation()}>
          <ModalHeader title={t('chromeAiSetupTitle')} onClose={onClose} />

          {/* Free & Safe badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              color: 'var(--accent)',
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            <Cpu size={11} />
            {t('chromeAiSetupFree')}
          </div>

          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7, marginBottom: 18, margin: '0 0 18px' }}>
            {t('chromeAiSetupDescription')}
          </p>

          {/* Status-specific message */}
          {(isDownloading || isDownloadable) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: 'var(--warning-bg, #fff8e1)',
                border: '1px solid var(--warning, #f59e0b)',
                borderRadius: 8,
                marginBottom: 18,
                fontSize: 12,
                color: 'var(--warning-text, #b45309)',
                lineHeight: 1.5,
              }}
            >
              <Cpu size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {t('chromeAiDownloadingMessage')}
            </div>
          )}
          {!isDownloading && !isDownloadable && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                marginBottom: 18,
                fontSize: 12,
                color: 'var(--text-3)',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {t('chromeAiUnsupportedMessage')}
            </div>
          )}

          {/* Setup steps */}
          <div style={{ color: 'var(--text-2)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            {t('chromeAiSetupStepsTitle')}
          </div>
          <ol style={{ margin: '0 0 18px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              t('chromeAiSetupStep1'),
              t('chromeAiSetupStep2'),
              t('chromeAiSetupStep3'),
            ] as string[]).map((step, i) => (
              <li key={i} style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
                {i === 1 ? (
                  <>
                    {step.split('chrome://flags').map((part, j) =>
                      j === 0 ? part : (
                        <>
                          <code
                            key={j}
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              padding: '1px 5px',
                              fontSize: 11,
                              fontFamily: 'monospace',
                            }}
                          >
                            chrome://flags
                          </code>
                          {part}
                        </>
                      )
                    )}
                  </>
                ) : step}
              </li>
            ))}
          </ol>

          {/* Reference link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <CheckCircle size={12} color="var(--accent)" />
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{t('chromeAiSetupRefLabel')}:</span>
            <a
              href={CHROME_AI_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent)',
                fontSize: 12,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              developer.chrome.com/docs/ai/built-in
              <ExternalLink size={11} />
            </a>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              padding: '0 16px',
              height: 34,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-2)',
            }}
          >
            {t('settingsCancel')}
          </button>
        </Panel>
      </Backdrop>
    )
  }

  if (phase === 'loading') {
    return (
      <Backdrop onClick={onClose}>
        <Panel width={360} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'var(--accent)' }}>
              <SpinnerIcon />
            </div>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
              {t('chromeAiImportAnalyzing')}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 4 }}>
              {t('chromeAiLoadingHint')}
            </div>
            <div
              style={{
                color: elapsedSeconds >= 10 ? 'var(--accent)' : 'var(--text-3)',
                fontSize: 13,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 16,
                transition: 'color 0.3s',
              }}
            >
              {elapsedSeconds}秒経過
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '0 16px',
                height: 34,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-2)',
              }}
            >
              {t('settingsCancel')}
            </button>
          </div>
        </Panel>
      </Backdrop>
    )
  }

  if (phase === 'error') {
    return (
      <Backdrop onClick={handleClose}>
        <Panel width={420} onClick={(e) => e.stopPropagation()}>
          <ModalHeader title={t('chromeAiImportTitle')} onClose={handleClose} />
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
            <div style={{ color: 'var(--danger)', fontSize: 13, lineHeight: 1.5 }}>{errorMessage}</div>
          </div>
          <button
            onClick={() => setPhase('idle')}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              padding: '0 16px',
              height: 34,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-2)',
            }}
          >
            {t('aiImportRetry')}
          </button>
        </Panel>
      </Backdrop>
    )
  }

  if (phase === 'preview') {
    return (
      <Backdrop onClick={handleClose}>
        <div onClick={(e) => e.stopPropagation()}>
          <ImportPreview
            persons={result}
            onApply={handleApply}
            onBack={() => setPhase('idle')}
          />
        </div>
      </Backdrop>
    )
  }

  const canAnalyze = tab === 'text' ? Boolean(text.trim()) : Boolean(imageFile)
  const handleAnalyzeClick = tab === 'text' ? handleAnalyze : handleAnalyzeImage

  return (
    <Backdrop onClick={handleClose}>
      <Panel width={540} onClick={(e) => e.stopPropagation()}>
        <ModalHeader title={t('chromeAiImportTitle')} onClose={handleClose} />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 11,
            color: 'var(--accent)',
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <Cpu size={11} />
          {t('chromeAiImportHint')}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 16,
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {(['text', 'image'] as Tab[]).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              style={{
                flex: 1,
                height: 34,
                border: 'none',
                borderRight: t_ === 'text' ? '1px solid var(--border)' : 'none',
                background: tab === t_ ? 'var(--accent)' : 'var(--surface-2)',
                color: tab === t_ ? '#fff' : 'var(--text-2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t_ === 'text' ? t('chromeAiTabText') : t('chromeAiTabImage')}
            </button>
          ))}
        </div>

        {/* Text tab */}
        {tab === 'text' && (
          <>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              {t('chromeAiImportSubtitle')}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('chromeAiImportPlaceholder')}
              maxLength={8000}
              rows={10}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 13,
                padding: '10px 12px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </>
        )}

        {/* Image tab */}
        {tab === 'image' && (
          <>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              {t('chromeAiImageSubtitle')}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) processFile(file)
              }}
              onClick={() => !imageFile && fileInputRef.current?.click()}
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
                cursor: imageFile ? 'default' : 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {imagePreviewUrl ? (
                <>
                  <img
                    src={imagePreviewUrl}
                    alt="preview"
                    style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 6, objectFit: 'contain' }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageFile(null)
                      setImagePreviewUrl(null)
                      setImageError(null)
                      if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '3px 10px',
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
                  <div style={{ color: 'var(--text-3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clipboard size={11} />
                    {t('aiImportPasteHint')}
                  </div>
                </>
              )}
            </div>

            {imageError && (
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
                {imageError}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) processFile(file)
                e.target.value = ''
              }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            disabled={!canAnalyze}
            onClick={handleAnalyzeClick}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 7,
              border: 'none',
              background: canAnalyze ? 'var(--accent)' : 'var(--surface-3)',
              color: canAnalyze ? '#fff' : 'var(--text-3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: canAnalyze ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {t('chromeAiImportAnalyze')}
          </button>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              padding: '0 16px',
              height: 36,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-2)',
              whiteSpace: 'nowrap',
            }}
          >
            {t('settingsCancel')}
          </button>
        </div>
      </Panel>
    </Backdrop>
  )
}

function Backdrop({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
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
        aria-label="Close"
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
