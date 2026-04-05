import { z } from 'zod'
import type { Locale } from '@/i18n/translations'
import { translations } from '@/i18n/translations'

const t = (key: keyof typeof translations, locale: Locale) => translations[key][locale]

export function createOrgUnitSchema(locale: Locale) {
  return z.object({
    unitName: z.string().min(1, t('validUnitNameRequired', locale)).max(100),
    unitType: z.enum([
      'company',
      'headquarters',
      'bureau',
      'department',
      'division',
      'section',
      'unit',
      'post',
    ]),
    headPersonName: z.string().max(100).optional().or(z.literal('')),
    memberCount: z.number().int().nonnegative().optional(),
    childUnitCount: z.number().int().nonnegative().optional(),
    description: z.string().max(500).optional().or(z.literal('')),
    tags: z.array(z.string().max(30)).max(10).optional(),
  })
}

// Static schema kept for backward-compatible type inference only
export const orgUnitSchema = createOrgUnitSchema('ja')
export type OrgUnitFormValues = z.infer<typeof orgUnitSchema>
