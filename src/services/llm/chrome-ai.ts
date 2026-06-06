import { llmOutputSchema, type ExtractedPerson } from './schema'

interface ChromeLanguageModelImageInput {
  type: 'image'
  content: ImageBitmap
}

interface ChromeLanguageModelCreateOptions {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>
  signal?: AbortSignal
}

interface ChromeLanguageModelSession {
  prompt(
    input: string | Array<string | ChromeLanguageModelImageInput>,
  ): Promise<string>
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
- If a field is not mentioned, set it to null. ALL fields except id, parentId, and name are nullable.
- Never hallucinate. Only include information present in the input.
- If a person's position in the hierarchy is ambiguous, make your best guess based on context.

Output schema:
{
  "persons": [
    {
      "id": "p1",
      "parentId": null,
      "name": "Full Name",
      "role": "Job Title or null",
      "department": "Department Name or null",
      "email": "email@example.com or null",
      "employmentType": "full-time | part-time | contract | intern | advisor | null"
    }
  ]
}`

const IMAGE_SYSTEM_PROMPT = `You are an expert at reading organizational chart images.
Extract all people and their hierarchical relationships visible in the image.

Rules:
- Output ONLY valid JSON. No markdown, no code blocks.
- Assign each person a unique short id (e.g. "p1", "p2", ...).
- Set parentId to null for the root (top-level person).
- If a field is not visible in the image, set it to null. ALL fields except id, parentId, and name are nullable.
- Never hallucinate. Only include information visible in the image.

Output schema:
{
  "persons": [
    {
      "id": "p1",
      "parentId": null,
      "name": "Full Name",
      "role": "Job Title or null",
      "department": "Department Name or null",
      "email": "email@example.com or null",
      "employmentType": "full-time | part-time | contract | intern | advisor | null"
    }
  ]
}`

const MAX_INPUT_CHARS = 8000
const PROMPT_TIMEOUT_MS = 20_000

/**
 * Normalize input text before sending to Gemini Nano.
 * Removes ASCII tree drawing characters and simplifies complex formatting
 * that small on-device models struggle with.
 */
function preprocessOrgText(text: string): string {
  return text
    // Tree diagram branch chars → plain indent
    .replace(/[├└]─+\s*/g, '- ')
    .replace(/│\s*/g, '  ')
    // Full-width space normalization
    .replace(/　/g, ' ')
    // Collapse 3+ consecutive spaces to 2
    .replace(/ {3,}/g, '  ')
    .trim()
}

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

/** Wrap a prompt Promise with a 20-second timeout. */
function withPromptTimeout<T>(promise: Promise<T>, timeoutMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), PROMPT_TIMEOUT_MS),
  )
  return Promise.race([promise, timeoutPromise]).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    if (
      msg.includes('タイムアウト') ||
      msg.includes('message channel closed') ||
      msg.includes('message port closed')
    ) {
      throw new Error(timeoutMessage)
    }
    throw err
  }) as Promise<T>
}

export async function analyzeImageWithChromeAI(file: File): Promise<ExtractedPerson[]> {
  if (typeof LanguageModel === 'undefined' || LanguageModel == null) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。')
  }

  const availability = await LanguageModel.availability()
  if (availability === 'unavailable') {
    throw new Error('Gemini Nano はこのデバイスで利用できません。')
  }
  if (availability === 'downloading') {
    throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。')
  }

  const SESSION_TIMEOUT_MS = 60_000

  let session: ChromeLanguageModelSession
  try {
    const sessionPromise = LanguageModel.create({
      expectedInputs: [{ type: 'text' }, { type: 'image' }],
      initialPrompts: [{ role: 'system', content: IMAGE_SYSTEM_PROMPT }],
    })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')), SESSION_TIMEOUT_MS),
    )
    session = await Promise.race([sessionPromise, timeoutPromise])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('タイムアウト')) throw err
    throw new Error(
      '画像入力セッションの作成に失敗しました。Chrome を最新版に更新し、chrome://flags で "Prompt API for Gemini Nano" を有効にしてください。',
    )
  }

  let imageBitmap: ImageBitmap | null = null
  try {
    imageBitmap = await createImageBitmap(file)

    const raw = await withPromptTimeout(
      session.prompt([
        '以下の組織図画像を解析してJSONを返してください。',
        { type: 'image', content: imageBitmap },
      ]),
      '解析がタイムアウトしました（20秒超過）。画像をシンプルにして再試行してください。',
    )

    let parsed: unknown
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw.trim())
    } catch {
      throw new Error('Chrome AIが無効なJSONを返しました。別の画像で再試行してください。(Invalid JSON from Chrome AI)')
    }

    const result = llmOutputSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`解析結果の検証に失敗しました: ${result.error.issues[0]?.message ?? 'unknown'}`)
    }

    return sanitizePersons(result.data.persons)
  } finally {
    imageBitmap?.close()
    session.destroy()
  }
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

  const processedText = preprocessOrgText(text)

  const SESSION_TIMEOUT_MS = 60_000
  const sessionPromise = LanguageModel.create({
    expectedInputs: [{ type: 'text' }],
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
  })
  const sessionTimeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')),
      SESSION_TIMEOUT_MS,
    ),
  )
  const session = await Promise.race([sessionPromise, sessionTimeoutPromise])

  try {
    const raw = await withPromptTimeout(
      session.prompt(`以下の組織構造を解析してJSONを返してください:\n\n${processedText}`),
      '解析がタイムアウトしました（20秒超過）。入力テキストを短くするか、シンプルな構造にして再試行してください。',
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
