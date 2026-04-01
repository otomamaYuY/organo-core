import { Building2, Users, ChevronDown } from 'lucide-react'
import type { OrgUnitData, OrgUnitType } from '@/types'
import { NODE_W, NODE_H } from '@/utils/nodeSize'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/translations'

const UNIT_VARS: Record<OrgUnitType, { color: string; bg: string }> = {
  company: { color: 'var(--unit-company)', bg: 'var(--unit-company-bg)' },
  headquarters: { color: 'var(--unit-hq)', bg: 'var(--unit-hq-bg)' },
  bureau: { color: 'var(--unit-bureau)', bg: 'var(--unit-bureau-bg)' },
  department: { color: 'var(--unit-dept)', bg: 'var(--unit-dept-bg)' },
  division: { color: 'var(--unit-division)', bg: 'var(--unit-division-bg)' },
  section: { color: 'var(--unit-section)', bg: 'var(--unit-section-bg)' },
  unit: { color: 'var(--unit-unit)', bg: 'var(--unit-unit-bg)' },
  post: { color: 'var(--unit-post)', bg: 'var(--unit-post-bg)' },
}

const UNIT_LABEL_KEY: Record<OrgUnitType, TranslationKey> = {
  company: 'unitCompany',
  headquarters: 'unitHQ',
  bureau: 'unitBureau',
  department: 'unitDept',
  division: 'unitDivision',
  section: 'unitSection',
  unit: 'unitTeam',
  post: 'unitPost',
}

interface UnitBannerProps {
  data: OrgUnitData
  selected: boolean
}

export function UnitBanner({ data, selected }: UnitBannerProps) {
  const vars = UNIT_VARS[data.unitType]
  const t = useT()

  return (
    <div
      data-testid="unit-banner"
      className="org-node-card"
      style={{
        background: selected ? 'var(--node-bg-sel)' : 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-sel)' : vars.color}`,
        borderRadius: 10,
        padding: '10px 14px',
        width: NODE_W,
        height: NODE_H,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: selected ? 'var(--node-shadow-sel)' : 'var(--node-shadow)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 7,
            background: vars.bg,
            border: `1px solid ${vars.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Building2 size={17} color={vars.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            data-testid="unit-name"
            style={{
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.unitName}
          </div>
          {data.headPersonName && (
            <div style={{ color: 'var(--text-2)', fontSize: 11 }}>{data.headPersonName}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span
            style={{
              background: vars.bg,
              border: `1px solid ${vars.color}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: vars.color,
              whiteSpace: 'nowrap',
            }}
          >
            {t(UNIT_LABEL_KEY[data.unitType])}
          </span>
          {data.memberCount != null && (
            <span
              style={{
                color: 'var(--text-3)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Users size={10} />
              {data.memberCount}
            </span>
          )}
        </div>
      </div>

      {data.description && (
        <div style={{ marginTop: 7, color: 'var(--text-3)', fontSize: 11, lineHeight: 1.4 }}>
          {data.description}
        </div>
      )}

      {data.tags && data.tags.length > 0 && (
        <div style={{ marginTop: 5, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.tags.map(tag => (
            <span
              key={tag}
              style={{
                background: 'var(--surface-3)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 10,
                color: 'var(--text-2)',
              }}
            >
              {tag}
            </span>
          ))}
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
