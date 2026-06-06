import { z } from 'zod'

/**
 * LLM output schema for org chart extraction.
 * Uses temporary id/parentId to represent hierarchy before merging into the store.
 */
const extractedPersonSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
  name: z.string().min(1),
  role: z.string().min(1).nullable().optional(),
  department: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  employmentType: z
    .enum(['full-time', 'part-time', 'contract', 'intern', 'advisor'])
    .nullable()
    .optional(),
})

export const llmOutputSchema = z.object({
  persons: z.array(extractedPersonSchema).min(1),
})

export type ExtractedPerson = z.infer<typeof extractedPersonSchema>
