import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orgUnitSchema, type OrgUnitFormValues } from '@/schemas/orgUnit.schema'
import type { OrgUnitData } from '@/types'
import { TagInput } from './TagInput'
import { Save } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/useLocaleStore'
import { asciiOnChange } from '@/utils/asciiFilter'

const FIELD_STYLE = {
  width: '100%',
  height: 34,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '0 9px',
  color: 'var(--text)',
  fontSize: 13,
  lineHeight: 1,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const LABEL_STYLE = {
  color: 'var(--text-2)',
  fontSize: 12,
  fontWeight: 500 as const,
  marginBottom: 4,
  display: 'block',
}

interface UnitEditFormProps {
  data: OrgUnitData
  onSave: (values: Partial<OrgUnitData>) => void
}

export function UnitEditForm({ data, onSave }: UnitEditFormProps) {
  const t = useT()
  const locale = useLocaleStore(s => s.locale)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    mode: 'onChange',
    defaultValues: {
      unitName: data.unitName,
      unitType: data.unitType,
      headPersonName: data.headPersonName ?? '',
      memberCount: data.memberCount,
      description: data.description ?? '',
      tags: data.tags ?? [],
    },
  })

  useEffect(() => {
    reset({
      unitName: data.unitName,
      unitType: data.unitType,
      headPersonName: data.headPersonName ?? '',
      memberCount: data.memberCount,
      description: data.description ?? '',
      tags: data.tags ?? [],
    })
  }, [data, reset])

  const tags = useWatch({ control, name: 'tags' }) ?? []

  const reg = (name: keyof OrgUnitFormValues) => {
    const { onChange, ...rest } = register(name as any)
    return { ...rest, onChange: asciiOnChange(locale, onChange) }
  }

  return (
    <form
      onSubmit={handleSubmit(values => onSave({ kind: 'org-unit', ...values }))}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div>
        <label style={LABEL_STYLE}>{t('fieldUnitName')} *</label>
        <input data-testid="input-unit-name" {...reg('unitName')} style={FIELD_STYLE} />
        {errors.unitName && (
          <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.unitName.message}</span>
        )}
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldUnitType')} *</label>
        {/* select value is always ASCII enum keys — no filter needed */}
        <select {...register('unitType')} style={FIELD_STYLE}>
          <option value="company">{t('unitCompany')}</option>
          <option value="headquarters">{t('unitHQ')}</option>
          <option value="bureau">{t('unitBureau')}</option>
          <option value="department">{t('unitDept')}</option>
          <option value="division">{t('unitDivision')}</option>
          <option value="section">{t('unitSection')}</option>
          <option value="unit">{t('unitTeam')}</option>
          <option value="post">{t('unitPost')}</option>
        </select>
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldHeadPerson')}</label>
        <input {...reg('headPersonName')} style={FIELD_STYLE} />
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldMemberCount')}</label>
        {/* number inputs are inherently ASCII — no filter needed */}
        <input
          {...register('memberCount', { valueAsNumber: true })}
          type="number"
          min={0}
          style={FIELD_STYLE}
        />
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldDescription')}</label>
        <textarea
          {...reg('description')}
          rows={3}
          style={{
            ...FIELD_STYLE,
            height: 'auto',
            padding: '7px 9px',
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldTags')}</label>
        <TagInput tags={tags} onChange={v => setValue('tags', v)} />
      </div>
      <button
        data-testid="btn-save-unit"
        type="submit"
        disabled={!isValid}
        style={{
          background: isValid ? 'var(--accent)' : 'var(--surface-3)',
          color: isValid ? '#fff' : 'var(--text-3)',
          border: 'none',
          borderRadius: 7,
          height: 36,
          padding: '0 14px',
          lineHeight: 1,
          cursor: isValid ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <Save size={14} />
        {t('save')}
      </button>
    </form>
  )
}
