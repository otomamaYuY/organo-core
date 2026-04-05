import { useState } from 'react'
import { X, Eye, EyeOff, Trash2, Check } from 'lucide-react'
import { useLlmSettingsStore, type LlmProvider } from '@/store/useLlmSettingsStore'
import { toast } from '@/store/useToastStore'
import { useT } from '@/hooks/useT'

interface LlmSettingsModalProps {
  onClose: () => void
}

export function LlmSettingsModal({ onClose }: LlmSettingsModalProps) {
  const t = useT()
  const store = useLlmSettingsStore()

  const [provider, setProvider] = useState<LlmProvider>(store.provider)
  const [bedrock, setBedrock] = useState({ ...store.bedrock })
  const [openai, setOpenai] = useState({ ...store.openai })
  const [azureOpenai, setAzureOpenai] = useState({ ...store.azureOpenai })
  const handleSave = () => {
    store.setProvider(provider)
    store.updateBedrock(bedrock)
    store.updateOpenai(openai)
    store.updateAzureOpenai(azureOpenai)
    store.saveToStorage()
    toast.success(t('settingsSaved'))
    onClose()
  }

  const handleClear = () => {
    store.clearAll()
    setBedrock({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' })
    setOpenai({ apiKey: '' })
    setAzureOpenai({ apiKey: '', endpoint: '' })
    setProvider('openai')
    toast.success(t('settingsCleared'))
  }

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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          width: 420,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
            {t('settingsTitle')}
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

        {/* Provider Select */}
        <FieldLabel label={t('settingsProvider')} />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
          style={{ width: '100%', marginBottom: 8 }}
        >
          <option value="openai">{t('settingsProviderOpenai')}</option>
          <option value="bedrock" disabled>{t('settingsProviderBedrock')} ({t('settingsComingSoon')})</option>
          <option value="azure-openai" disabled>{t('settingsProviderAzure')} ({t('settingsComingSoon')})</option>
        </select>
        <div
          style={{
            color: 'var(--text-3)',
            fontSize: 11,
            marginBottom: 16,
          }}
        >
          {t('settingsOnlyOpenai')}
        </div>

        {/* Dynamic Fields */}
        {provider === 'bedrock' && (
          <>
            <FieldLabel label={t('settingsAccessKeyId')} />
            <SecretInput
              value={bedrock.accessKeyId}
              onChange={(v) => setBedrock({ ...bedrock, accessKeyId: v })}
              placeholder="AKIA..."
            />
            <FieldLabel label={t('settingsSecretAccessKey')} />
            <SecretInput
              value={bedrock.secretAccessKey}
              onChange={(v) => setBedrock({ ...bedrock, secretAccessKey: v })}
              placeholder="wJa..."
            />
            <FieldLabel label={t('settingsRegion')} />
            <input
              value={bedrock.region}
              onChange={(e) => setBedrock({ ...bedrock, region: e.target.value })}
              placeholder="us-east-1"
              style={{ width: '100%', marginBottom: 16 }}
            />
          </>
        )}

        {provider === 'openai' && (
          <>
            <FieldLabel label={t('settingsApiKey')} />
            <SecretInput
              value={openai.apiKey}
              onChange={(v) => setOpenai({ ...openai, apiKey: v })}
              placeholder="sk-..."
            />
          </>
        )}

        {provider === 'azure-openai' && (
          <>
            <FieldLabel label={t('settingsApiKey')} />
            <SecretInput
              value={azureOpenai.apiKey}
              onChange={(v) => setAzureOpenai({ ...azureOpenai, apiKey: v })}
              placeholder="API Key"
            />
            <FieldLabel label={t('settingsEndpoint')} />
            <input
              value={azureOpenai.endpoint}
              onChange={(e) => setAzureOpenai({ ...azureOpenai, endpoint: e.target.value })}
              placeholder="https://your-resource.openai.azure.com/"
              style={{ width: '100%', marginBottom: 16 }}
            />
          </>
        )}

        {/* Security note */}
        <div
          style={{
            color: 'var(--text-3)',
            fontSize: 11,
            marginBottom: 20,
            padding: '8px 10px',
            background: 'var(--surface-2)',
            borderRadius: 6,
            lineHeight: 1.5,
          }}
        >
          {t('settingsSecurityNote')}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={btnStyle('accent')}>
            <Check size={14} />
            {t('settingsSave')}
          </button>
          <button onClick={onClose} style={btnStyle('default')}>
            {t('settingsCancel')}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={handleClear} style={btnStyle('danger')}>
            <Trash2 size={13} />
            {t('settingsClear')}
          </button>
        </div>

      </div>
    </div>
  )
}

function FieldLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        color: 'var(--text-2)',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 5,
      }}
    >
      {label}
    </div>
  )
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-3)',
          display: 'flex',
          padding: 4,
        }}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

function btnStyle(variant: 'accent' | 'default' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '0 14px',
    height: 34,
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'background 0.15s, color 0.15s',
  }

  switch (variant) {
    case 'accent':
      return {
        ...base,
        background: 'var(--accent)',
        borderColor: 'var(--accent)',
        color: '#fff',
      }
    case 'danger':
      return {
        ...base,
        background: 'var(--danger-bg)',
        borderColor: 'var(--danger-border)',
        color: 'var(--danger)',
      }
    default:
      return {
        ...base,
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text-2)',
      }
  }
}
