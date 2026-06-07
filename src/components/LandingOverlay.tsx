import { useState, useRef, useEffect } from 'react'
import { Move, Download, ShieldCheck } from 'lucide-react'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'
import { PrivacyCenterModal } from '@/components/privacy/PrivacyCenterModal'

const FEATURES = [
  {
    Icon: Move,
    ja: { title: '直感的な操作', desc: 'ドラッグ&ドロップで自由に配置・編集' },
    en: { title: 'Intuitive editing', desc: 'Drag & drop to arrange and connect' },
  },
  {
    Icon: Download,
    ja: { title: '多彩なエクスポート', desc: 'JSON・CSV・PNG・PDFなど多形式に対応。SFA/CRM・タレントマネジメントシステム連携や生成AI活用にも' },
    en: { title: 'Versatile export', desc: 'JSON, CSV, PNG, PDF & more — ready for SFA/CRM, talent systems, and generative AI' },
  },
  {
    Icon: ShieldCheck,
    ja: { title: '100% セキュア', desc: 'サーバーなし。データはすべてブラウザ内のみに保存' },
    en: { title: '100% Secure', desc: 'No server. All data stored only in your browser' },
  },
]

export function LandingOverlay() {
  const showLanding = useOnboardingStore(s => s.showLanding)
  const completeLanding = useOnboardingStore(s => s.completeLanding)
  const applyAutoLayout = useOrgStore(s => s.applyAutoLayout)
  const t = useT()
  const [closing, setClosing] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showLanding) return
    const timer = setTimeout(() => ctaRef.current?.focus(), 650)
    return () => clearTimeout(timer)
  }, [showLanding])

  if (!showLanding && !closing) return null

  const handleCta = () => {
    applyAutoLayout()
    setClosing(true)
    setTimeout(() => {
      completeLanding()
      setClosing(false)
    }, 350)
  }

  return (
    <>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: closing ? 'landingFadeOut 0.35s ease forwards' : 'landingFadeIn 0.5s ease',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 560,
          width: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '36px 32px 28px',
          animation: closing
            ? 'landingSlideOut 0.35s ease forwards'
            : 'landingSlideIn 0.5s ease',
        }}
      >
        {/* Title */}
        <h1 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
          ブラウザで組織図をかんたん作成
        </h1>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
          Create org charts in your browser
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-2)' }}>
          インストール不要。データは端末から出ません。
          <span style={{ color: 'var(--text-3)', marginLeft: 6, fontStyle: 'italic' }}>
            No install. Your data stays local.
          </span>
        </p>

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {FEATURES.map(({ Icon, ja, en }) => {
            const isSecure = Icon === ShieldCheck
            return (
              <div
                key={ja.title}
                onClick={isSecure ? () => setShowPrivacy(true) : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: isSecure ? 'pointer' : 'default',
                  transition: isSecure ? 'background 0.15s, border-color 0.15s' : undefined,
                }}
                onMouseEnter={isSecure ? (e) => {
                  e.currentTarget.style.background = 'var(--accent-bg)'
                  e.currentTarget.style.borderColor = 'var(--accent-border)'
                } : undefined}
                onMouseLeave={isSecure ? (e) => {
                  e.currentTarget.style.background = 'var(--surface-2)'
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                } : undefined}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {ja.title}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                      {en.title}
                    </span>
                    {isSecure && (
                      <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 'auto' }}>
                        詳細を見る →
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {ja.desc}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, fontStyle: 'italic', marginTop: 2 }}>
                    {en.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'GitHub', href: 'https://github.com/otomamaYuY/organo-core' },
            { label: 'Issue / Feedback', href: 'https://github.com/otomamaYuY/organo-core/issues' },
            { label: 'Changelog', href: 'https://github.com/otomamaYuY/organo-core/releases' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA button */}
        <button
          ref={ctaRef}
          onClick={handleCta}
          className="landing-cta"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'filter 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.15)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'brightness(1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {t('landingCta')} / Start Free
        </button>
      </div>

      <style>{`
        @keyframes ctaRipple {
          0%   { box-shadow: 0 4px 18px rgba(99,102,241,0.35), 0 0 0 0 rgba(99,102,241,0.45); }
          70%  { box-shadow: 0 4px 18px rgba(99,102,241,0.35), 0 0 0 14px rgba(99,102,241,0); }
          100% { box-shadow: 0 4px 18px rgba(99,102,241,0.35), 0 0 0 0 rgba(99,102,241,0); }
        }
        .landing-cta {
          animation: ctaRipple 1.8s ease-out 0.65s 3 both;
        }
        .landing-cta:focus-visible {
          outline: 2px solid rgba(99,102,241,0.7);
          outline-offset: 3px;
        }
        @keyframes landingFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes landingFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes landingSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes landingSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-14px) scale(0.97); }
        }
      `}</style>
    </div>
    {showPrivacy && <PrivacyCenterModal onClose={() => setShowPrivacy(false)} />}
    </>
  )
}
