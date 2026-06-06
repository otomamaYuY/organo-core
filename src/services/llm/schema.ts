import { z } from 'zod'

/**
 * LLM output schema for org chart extraction.
 * Uses temporary id/parentId to represent hierarchy before merging into the store.
 *
 * z.preprocess wrappers absorb common LLM output variations:
 *   - empty string "" → null
 *   - literal string "null" / "none" → null
 *   - Japanese employment-type labels → canonical English enum values
 */

/** Converts empty / null-like strings to null. */
function coerceNullable(v: unknown): unknown {
  if (v === null || v === undefined) return null
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'none') return null
  }
  return v
}

/**
 * Maps any employment-type string (English or Japanese) to one of the four
 * canonical enum values, or null if unrecognised.
 */
function coerceEmploymentType(v: unknown): unknown {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') return null
  const s = v.toLowerCase().trim()
  if (!s || s === 'null' || s === 'none') return null
  if (s === 'full-time' || s.includes('full') || s.includes('フル') || s.includes('正社員')) return 'full-time'
  if (s === 'part-time' || s.includes('part') || s.includes('パート') || s.includes('非常勤')) return 'part-time'
  if (s === 'contract' || s.includes('contract') || s.includes('委託') || s.includes('業務委') || s.includes('フリーランス') || s.includes('派遣')) return 'contract'
  if (s === 'intern' || s.includes('intern') || s.includes('インターン') || s.includes('実習')) return 'intern'
  if (s === 'advisor' || s.includes('advisor') || s.includes('アドバイザー') || s.includes('顧問')) return 'advisor'
  // Unrecognised value — discard safely rather than failing validation
  return null
}

const extractedPersonSchema = z.object({
  id: z.string().min(1),
  // parentId may arrive as "" or "null" (string) — normalise to actual null
  parentId: z.preprocess(coerceNullable, z.string().nullable()),
  name: z.string().min(1),
  // role/department/email: LLMs often return "" instead of null
  role: z.preprocess(coerceNullable, z.string().nullable().optional()),
  department: z.preprocess(coerceNullable, z.string().nullable().optional()),
  email: z.preprocess(coerceNullable, z.string().nullable().optional()),
  // employmentType: accept any label and map to canonical values
  employmentType: z.preprocess(
    coerceEmploymentType,
    z.enum(['full-time', 'part-time', 'contract', 'intern', 'advisor']).nullable(),
  ),
})

export const llmOutputSchema = z.object({
  persons: z.array(extractedPersonSchema).min(1),
})

export type ExtractedPerson = z.infer<typeof extractedPersonSchema>
