import { z } from 'zod'
import type { Locale } from '@/i18n/translations'
import { translations } from '@/i18n/translations'

const t = (key: keyof typeof translations, locale: Locale) => translations[key][locale]

export function createOrgPersonSchema(locale: Locale) {
  return z.object({
    name: z.string().min(1, t('validNameRequired', locale)).max(100),
    role: z.string().min(1, t('validRoleRequired', locale)).max(100),
    department: z.string().max(100).optional(),
    email: z
      .string()
      .trim()
      .max(254, t('validEmailMax', locale))
      .refine(
        v =>
          v === '' ||
          (/^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(v) &&
            !v.includes('..')),
        t('validEmailFormat', locale),
      )
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+?[0-9\-]+$/, t('validPhoneFormat', locale))
      .optional()
      .or(z.literal('')),
    employmentType: z
      .enum(['full-time', 'part-time', 'contract', 'intern', 'advisor'])
      .or(z.literal(''))
      .optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  })
}

// Static schema kept for backward-compatible type inference only
export const orgPersonSchema = createOrgPersonSchema('ja')
export type OrgPersonFormValues = z.infer<typeof orgPersonSchema>
