import { useState } from 'react'
import { X, ShieldCheck, CheckCircle, XCircle, HardDrive, Trash2, AlertTriangle } from 'lucide-react'
import { useT } from '@/hooks/useT'
import {
  getStorageInfo,
  clearAllAppData,
  removeStorageKey,
  formatBytes,
  totalBytes,
} from '@/utils/storageInfo'

interface PrivacyCenterModalProps {
  onClose: () => void
}

export function PrivacyCenterModal({ onClose }: PrivacyCenterModalProps) {
  const t = useT()
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const storageInfos = getStorageInfo()
  const total = totalBytes(storageInfos)

  const handleClearAll = () => {
    clearAllAppData()
    location.reload()
  }

  const handleDeleteKey = (key: string) => {
    if (window.confirm(t('privacyStorageDeleteConfirm'))) {
      removeStorageKey(key)
      location.reload()
    }
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
          width: 480,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>
            <ShieldCheck size={17} color="var(--accent)" />
            {t('privacyCenterTitle')}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Does / Doesn't ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {/* Does */}
          <Section title={t('privacyDoesTitle')} accent>
            {[t('privacyDoes1'), t('privacyDoes2'), t('privacyDoes3')].map((text) => (
              <DoesItem key={text} icon={<CheckCircle size={12} color="var(--accent)" />} text={text} />
            ))}
          </Section>
          {/* Doesn't */}
          <Section title={t('privacyDoesntTitle')}>
            {[t('privacyDoesnt1'), t('privacyDoesnt2'), t('privacyDoesnt3'), t('privacyDoesnt4')].map((text) => (
              <DoesItem key={text} icon={<XCircle size={12} color="var(--danger)" />} text={text} />
            ))}
          </Section>
        </div>

        {/* ── Storage ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <HardDrive size={13} />
              {t('privacyStorageTitle')}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {t('privacyStorageTotal')}: {formatBytes(total)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {storageInfos.map((info) => (
              <div
                key={info.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  fontSize: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t(info.descKey)}
                  </div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'monospace' }}>
                    {info.key}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: info.exists ? 'var(--text-2)' : 'var(--text-3)',
                    whiteSpace: 'nowrap',
                    minWidth: 48,
                    textAlign: 'right',
                  }}
                >
                  {info.exists ? formatBytes(info.bytes) : t('privacyStorageEmpty')}
                </span>
                {info.exists && (
                  <button
                    onClick={() => handleDeleteKey(info.key)}
                    title={t('privacyStorageDeleteKey')}
                    style={{
                      background: 'none',
                      border: '1px solid var(--danger-border)',
                      borderRadius: 5,
                      padding: '2px 5px',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Clear All ── */}
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            <AlertTriangle size={14} />
            {t('privacyClearTitle')}
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {t('privacyClearDesc')}
          </p>
          {confirmingClearAll ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleClearAll}
                style={dangerBtnStyle}
              >
                <Trash2 size={13} />
                {t('privacyClearConfirmBtn')}
              </button>
              <button
                onClick={() => setConfirmingClearAll(false)}
                style={cancelBtnStyle}
              >
                {t('privacyClearCancelBtn')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClearAll(true)}
              style={dangerOutlineBtnStyle}
            >
              <Trash2 size={13} />
              {t('privacyClearBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  accent = false,
  children,
}: {
  title: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: accent ? 'var(--accent-bg)' : 'var(--surface-2)',
        border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function DoesItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

const dangerBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 14px',
  height: 32,
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--danger-border)',
  background: 'var(--danger)',
  color: '#fff',
}

const dangerOutlineBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 14px',
  height: 32,
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--danger-border)',
  background: 'var(--danger-bg)',
  color: 'var(--danger)',
}

const cancelBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 14px',
  height: 32,
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-2)',
}
