import { useState } from 'react'
import { X, ShieldCheck, CheckCircle, XCircle, HardDrive, Trash2, AlertTriangle, Wifi, WifiOff, Activity } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useNetworkStore, type NetworkRequest } from '@/store/useNetworkStore'
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
  const isSending = useNetworkStore(s => s.activeCount > 0)
  const requests = useNetworkStore(s => s.requests)

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

        {/* ── Network Monitor ── */}
        <div style={{ marginBottom: 20 }}>
          {/* Status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              marginBottom: requests.length > 0 ? 8 : 0,
              background: isSending ? 'rgba(245,158,11,0.08)' : 'var(--accent-bg)',
              border: `1px solid ${isSending ? 'rgba(245,158,11,0.35)' : 'var(--accent-border)'}`,
              borderRadius: requests.length > 0 ? '10px 10px 0 0' : 10,
              transition: 'background 0.3s, border-color 0.3s',
            }}
          >
            {isSending
              ? <Wifi size={15} color="var(--warning, #f59e0b)" />
              : <WifiOff size={15} color="var(--accent)" />
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isSending ? 'var(--warning, #f59e0b)' : 'var(--accent)' }}>
                {isSending ? t('privacyNetworkSending') : t('privacyNetworkOffline')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {isSending
                  ? t('privacyNetworkSendingDesc')
                  : requests.length === 0
                    ? t('privacyNetworkNeverSent')
                    : `${t('privacyNetworkTotal')}: ${requests.length}`
                }
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={12} color="var(--text-3)" />
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                {requests.filter(r => r.status === null).length > 0
                  ? `${requests.filter(r => r.status === null).length} active`
                  : `${requests.length} logged`
                }
              </span>
              {/* Live dot */}
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isSending ? 'var(--warning, #f59e0b)' : '#22c55e',
                flexShrink: 0, transition: 'background 0.3s',
              }} />
            </div>
          </div>

          {/* Request log */}
          {requests.length > 0 && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                overflow: 'hidden',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {requests.map(req => (
                <RequestRow key={req.id} req={req} />
              ))}
            </div>
          )}
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

function RequestRow({ req }: { req: NetworkRequest }) {
  const isActive = req.status === null
  const isError = req.status !== null && (req.status === 0 || req.status >= 400)
  const statusColor = isActive
    ? 'var(--warning, #f59e0b)'
    : isError
      ? 'var(--danger)'
      : '#22c55e'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        fontFamily: 'monospace',
        background: isActive ? 'rgba(245,158,11,0.04)' : 'transparent',
      }}
    >
      {/* Status dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: statusColor, flexShrink: 0,
      }} />
      {/* Method */}
      <span style={{ color: 'var(--text-3)', minWidth: 36 }}>{req.method}</span>
      {/* URL label */}
      <span style={{ flex: 1, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {req.label}
      </span>
      {/* Status code */}
      <span style={{ color: statusColor, minWidth: 28, textAlign: 'right' }}>
        {req.status === null ? '…' : req.status === 0 ? 'ERR' : req.status}
      </span>
      {/* Duration */}
      {req.durationMs !== null && (
        <span style={{ color: 'var(--text-3)', minWidth: 42, textAlign: 'right' }}>
          {req.durationMs < 1000 ? `${req.durationMs}ms` : `${(req.durationMs / 1000).toFixed(1)}s`}
        </span>
      )}
      {/* Time */}
      <span style={{ color: 'var(--text-3)', minWidth: 52, textAlign: 'right' }}>
        {new Date(req.startedAt).toLocaleTimeString()}
      </span>
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
