import { z } from 'zod'

export const orgUnitSchema = z.object({
  unitName: z.string().min(1, '組織名は必須です').max(100),
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
  description: z.string().max(500).optional().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export type OrgUnitFormValues = z.infer<typeof orgUnitSchema>
