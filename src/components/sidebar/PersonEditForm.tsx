import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orgPersonSchema, type OrgPersonFormValues } from '@/schemas/orgPerson.schema'
import type { OrgPersonData } from '@/types'
import { TagInput } from './TagInput'
import { Save } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/useLocaleStore'
import { asciiOnChange, toHalfWidthPhone, normalizeEmail } from '@/utils/asciiFilter'

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

interface PersonEditFormProps {
  data: OrgPersonData
  onSave: (values: Partial<OrgPersonData>) => void
}

export function PersonEditForm({ data, onSave }: PersonEditFormProps) {
  const t = useT()
  const locale = useLocaleStore(s => s.locale)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<OrgPersonFormValues>({
    resolver: zodResolver(orgPersonSchema),
    mode: 'onChange',
    defaultValues: {
      name: data.name,
      role: data.role,
      department: data.department ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      employmentType: data.employmentType,
      tags: data.tags ?? [],
    },
  })

  useEffect(() => {
    reset({
      name: data.name,
      role: data.role,
      department: data.department ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      employmentType: data.employmentType,
      tags: data.tags ?? [],
    })
  }, [data, reset])

  const tags = useWatch({ control, name: 'tags' }) ?? []

  // Helper: wrap register's onChange with ASCII filter in EN mode
  const reg = (name: keyof OrgPersonFormValues) => {
    const { onChange, ...rest } = register(name as any)
    return { ...rest, onChange: asciiOnChange(locale, onChange) }
  }

  // Email: normalize full-width chars and trim whitespace on input
  const { onChange: emailOnChange, ...emailReg } = register('email')
  const emailProps = {
    ...emailReg,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = normalizeEmail(e.target.value)
      emailOnChange(e)
    },
  }

  // Phone: convert full-width digits/hyphens to half-width on input
  const { onChange: phoneOnChange, ...phoneReg } = register('phone')
  const phoneProps = {
    ...phoneReg,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = toHalfWidthPhone(e.target.value)
      phoneOnChange(e)
    },
  }

  return (
    <form
      onSubmit={handleSubmit(values => onSave({ kind: 'person', ...values }))}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div>
        <label style={LABEL_STYLE}>{t('fieldName')} *</label>
        <input data-testid="input-name" {...reg('name')} style={FIELD_STYLE} />
        {errors.name && (
          <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.name.message}</span>
        )}
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldRole')} *</label>
        <input data-testid="input-role" {...reg('role')} style={FIELD_STYLE} />
        {errors.role && (
          <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.role.message}</span>
        )}
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldDept')}</label>
        <input {...reg('department')} style={FIELD_STYLE} />
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldEmail')}</label>
        <input {...emailProps} type="email" style={FIELD_STYLE} />
        {errors.email && (
          <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.email.message}</span>
        )}
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldPhone')}</label>
        <input {...phoneProps} type="tel" style={FIELD_STYLE} />
        {errors.phone && (
          <span style={{ color: 'var(--danger)', fontSize: 11 }}>{errors.phone.message}</span>
        )}
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldEmployment')}</label>
        <select {...register('employmentType')} style={FIELD_STYLE}>
          <option value="">{t('selectPlaceholder')}</option>
          <option value="full-time">{t('empFullTime')}</option>
          <option value="part-time">{t('empPartTime')}</option>
          <option value="contract">{t('empContract')}</option>
          <option value="intern">{t('empIntern')}</option>
          <option value="advisor">{t('empAdvisor')}</option>
        </select>
      </div>
      <div>
        <label style={LABEL_STYLE}>{t('fieldTags')}</label>
        <TagInput tags={tags} onChange={v => setValue('tags', v)} />
      </div>
      <button
        data-testid="btn-save-person"
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
