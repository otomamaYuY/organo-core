import { useState, useCallback, useEffect } from 'react'
import { X, Bot, AlertCircle, Cpu, ExternalLink, CheckCircle } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { importGraphFromText, type ExtractedPerson } from '@/services/llm'
import { useAiImport } from '@/hooks/useAiImport'
import { ImportPreview } from './ImportPreview'
import { getChromeAiAvailability, type ChromeAiAvailability } from '@/services/llm/chrome-ai'

interface ChromeAiImportModalProps {
  onClose: () => void
}

type Phase = 'idle' | 'loading' | 'preview' | 'error'

const CHROME_AI_DOCS_URL = 'https://developer.chrome.com/docs/ai/built-in'

export function ChromeAiImportModal({ onClose }: ChromeAiImportModalProps) {
  const t = useT()
  const { applyToChart } = useAiImport()

  const [phase, setPhase] = useState<Phase>('idle')
  const [text, setText] = useState('')
  const [result, setResult] = useState<ExtractedPerson[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [availability, setAvailability] = useState<ChromeAiAvailability | 'checking'>('checking')

  useEffect(() => {
    getChromeAiAvailability().then(setAvailability)
  }, [])

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
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 16 }}>{t('chromeAiImportHint')}</div>
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

  return (
    <Backdrop onClick={handleClose}>
      <Panel width={520} onClick={(e) => e.stopPropagation()}>
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

        <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
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

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            disabled={!text.trim()}
            onClick={handleAnalyze}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 7,
              border: 'none',
              background: text.trim() ? 'var(--accent)' : 'var(--surface-3)',
              color: text.trim() ? '#fff' : 'var(--text-3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
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
