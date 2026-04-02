import { z } from 'zod'

export const orgPersonSchema = z.object({
  name: z.string().min(1, '氏名は必須です').max(100),
  role: z.string().min(1, '役職は必須です').max(100),
  department: z.string().max(100).optional(),
  email: z
    .string()
    .trim()
    .max(254, 'メールアドレスは254文字以内で入力してください')
    .refine(
      v =>
        v === '' ||
        /^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(v) &&
          !v.includes('..'),
      '正しいメールアドレスを入力してください',
    )
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[0-9\-]+$/, '半角数字、ハイフン、国際番号(+)のみで入力してください')
    .optional()
    .or(z.literal('')),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern', 'advisor']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export type OrgPersonFormValues = z.infer<typeof orgPersonSchema>
