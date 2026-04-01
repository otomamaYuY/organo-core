import { z } from 'zod'

export const orgPersonSchema = z.object({
  name: z.string().min(1, '氏名は必須です').max(100),
  role: z.string().min(1, '役職は必須です').max(100),
  department: z.string().max(100).optional(),
  email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\-+()\s]*$/, '電話番号の形式が不正です')
    .optional()
    .or(z.literal('')),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern', 'advisor']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export type OrgPersonFormValues = z.infer<typeof orgPersonSchema>
