import { useState, useCallback } from 'react'
import { X, Bot, AlertCircle, Cpu } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { importGraphFromText, type ExtractedPerson } from '@/services/llm'
import { useAiImport } from '@/hooks/useAiImport'
import { ImportPreview } from './ImportPreview'

interface ChromeAiImportModalProps {
  onClose: () => void
}

type Phase = 'idle' | 'loading' | 'preview' | 'error'

export function ChromeAiImportModal({ onClose }: ChromeAiImportModalProps) {
  const t = useT()
  const { applyToChart } = useAiImport()

  const [phase, setPhase] = useState<Phase>('idle')
  const [text, setText] = useState('')
  const [result, setResult] = useState<ExtractedPerson[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  if (phase === 'loading') {
    return (
      <Backdrop onClick={() => {}}>
        <Panel width={360}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'var(--accent)' }}>
              <SpinnerIcon />
            </div>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
              {t('chromeAiImportAnalyzing')}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{t('chromeAiImportHint')}</div>
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
