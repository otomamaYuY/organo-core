import { User, Briefcase, Mail, Phone, ChevronDown } from 'lucide-react'
import type { OrgPersonData } from '@/types'
import { NODE_W, NODE_H } from '@/utils/nodeSize'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/translations'

const EMPLOYMENT_KEY: Record<string, TranslationKey> = {
  'full-time': 'empLabelFullTime',
  'part-time': 'empLabelPartTime',
  contract: 'empLabelContract',
  intern: 'empLabelIntern',
  advisor: 'empLabelAdvisor',
}

interface PersonCardProps {
  data: OrgPersonData
  selected: boolean
}

export function PersonCard({ data, selected }: PersonCardProps) {
  const t = useT()

  return (
    <div
      data-testid="person-card"
      className="org-node-card"
      style={{
        background: selected ? 'var(--node-bg-sel)' : 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-sel)' : 'var(--node-border)'}`,
        borderRadius: 10,
        padding: '11px 13px',
        width: NODE_W,
        height: NODE_H,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: selected ? 'var(--node-shadow-sel)' : 'var(--node-shadow)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={18} color="var(--accent)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            data-testid="person-name"
            style={{
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.name}
          </div>
          <div
            data-testid="person-role"
            style={{
              color: 'var(--text-2)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Briefcase size={10} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.role}
            </span>
          </div>
        </div>
      </div>

      {data.department && (
        <div
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 4,
            padding: '2px 7px',
            fontSize: 11,
            color: 'var(--accent-text)',
            marginBottom: 5,
            display: 'inline-block',
          }}
        >
          {data.department}
        </div>
      )}

      {(data.email || data.phone) && (
        <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data.email && (
            <div
              style={{
                color: 'var(--text-3)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Mail size={10} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.email}
              </span>
            </div>
          )}
          {data.phone && (
            <div
              style={{
                color: 'var(--text-3)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Phone size={10} />
              <span>{data.phone}</span>
            </div>
          )}
        </div>
      )}

      {data.employmentType && EMPLOYMENT_KEY[data.employmentType] && (
        <div style={{ marginTop: 5 }}>
          <span
            style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success)',
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: 10,
              color: 'var(--success)',
            }}
          >
            {t(EMPLOYMENT_KEY[data.employmentType])}
          </span>
        </div>
      )}

      {data.isCollapsed && data.childCount && data.childCount > 0 && (
        <div
          style={{
            marginTop: 7,
            background: 'var(--warn-bg)',
            border: '1px solid var(--warn)',
            borderRadius: 5,
            padding: '2px 7px',
            fontSize: 11,
            color: 'var(--warn)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <ChevronDown size={11} />+{data.childCount}
        </div>
      )}
    </div>
  )
}
