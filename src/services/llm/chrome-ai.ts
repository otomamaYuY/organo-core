import { llmOutputSchema, type ExtractedPerson } from './schema'

interface ChromeLanguageModelCreateOptions {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  signal?: AbortSignal
}

interface ChromeLanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>
  destroy(): void
}

interface ChromeLanguageModelAPI {
  availability(options?: object): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>
  create(options?: ChromeLanguageModelCreateOptions): Promise<ChromeLanguageModelSession>
}

declare global {
  var LanguageModel: ChromeLanguageModelAPI | undefined
}

export type ChromeAiAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'unsupported'

export async function getChromeAiAvailability(): Promise<ChromeAiAvailability> {
  if (typeof window === 'undefined') return 'unsupported'
  if (typeof LanguageModel === 'undefined' || LanguageModel == null) return 'unsupported'
  try {
    return await LanguageModel.availability()
  } catch {
    return 'unsupported'
  }
}

const SYSTEM_PROMPT = `You are an expert at parsing organizational structure descriptions.
Extract all people and their hierarchical relationships from the user's text.

Rules:
- Output ONLY valid JSON. No markdown, no code blocks.
- Assign each person a unique short id (e.g. "p1", "p2", ...).
- Set parentId to null for the root (top-level person).
- If a field is not mentioned, set it to null.
- Never hallucinate. Only include information present in the input.

Output schema:
{
  "persons": [
    {
      "id": "p1",
      "parentId": null,
      "name": "Full Name",
      "role": "Job Title",
      "department": "Department Name or null",
      "email": "email@example.com or null",
      "employmentType": "full-time | part-time | contract | intern | advisor | null"
    }
  ]
}`

const MAX_INPUT_CHARS = 8000

/**
 * Fix up LLM output after Zod validation:
 * 1. Nullify parentId that references a non-existent id (including self-reference)
 * 2. Break circular reference chains by nullifying the offending parentId
 */
function sanitizePersons(persons: ExtractedPerson[]): ExtractedPerson[] {
  const idSet = new Set(persons.map((p) => p.id))

  // Step 1: referential integrity — parentId must exist in the array and not be self
  const fixed = persons.map((p) => ({
    ...p,
    parentId:
      p.parentId !== null &&
      p.parentId !== undefined &&
      idSet.has(p.parentId) &&
      p.parentId !== p.id
        ? p.parentId
        : null,
  }))

  // Step 2: circular reference detection — walk each node's ancestor chain;
  // if we revisit a node we've already seen, the current node closes a cycle → break it
  const parentMap = new Map<string, string | null>(fixed.map((p) => [p.id, p.parentId ?? null]))
  const cycleBreakers = new Set<string>()

  for (const person of fixed) {
    if (parentMap.get(person.id) === null) continue

    const visited = new Set<string>()
    visited.add(person.id)
    let cursor: string | null = parentMap.get(person.id) ?? null

    while (cursor !== null) {
      if (visited.has(cursor)) {
        cycleBreakers.add(person.id)
        break
      }
      visited.add(cursor)
      cursor = parentMap.get(cursor) ?? null
    }
  }

  return fixed.map((p) => (cycleBreakers.has(p.id) ? { ...p, parentId: null } : p))
}

export async function analyzeTextWithChromeAI(text: string): Promise<ExtractedPerson[]> {
  if (text.length > MAX_INPUT_CHARS) {
    throw new Error(`入力テキストが長すぎます（上限 ${MAX_INPUT_CHARS} 文字）。短くしてから再試行してください。`)
  }

  if (typeof LanguageModel === 'undefined' || LanguageModel == null) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。(Chrome Built-in AI is not available in this browser.)')
  }

  const availability = await LanguageModel.availability()
  if (availability === 'unavailable') {
    throw new Error('Gemini Nano はこのデバイスで利用できません。(Gemini Nano is not available on this device.)')
  }
  if (availability === 'downloading') {
    throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。(Gemini Nano is downloading. Please wait and try again.)')
  }

  const SESSION_TIMEOUT_MS = 60_000
  const sessionPromise = LanguageModel.create({
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
  })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')),
      SESSION_TIMEOUT_MS,
    ),
  )
  const session = await Promise.race([sessionPromise, timeoutPromise])

  try {
    const raw = await session.prompt(
      `以下の組織構造を解析してJSONを返してください:\n\n${text}`,
    )

    let parsed: unknown
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw.trim())
    } catch {
      throw new Error('Chrome AIが無効なJSONを返しました。入力を見直して再試行してください。(Invalid JSON from Chrome AI)')
    }

    const result = llmOutputSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`解析結果の検証に失敗しました: ${result.error.issues[0]?.message ?? 'unknown'}`)
    }

    return sanitizePersons(result.data.persons)
  } finally {
    session.destroy()
  }
}
