import { llmOutputSchema, type ExtractedPerson } from './schema'

interface ChromeLanguageModelImageInput {
  type: 'image'
  content: ImageBitmap
}

interface ChromeLanguageModelCreateOptions {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>
}

interface ChromeLanguageModelSession {
  prompt(input: string | Array<string | ChromeLanguageModelImageInput>): Promise<string>
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

// ── Prompt builders ─────────────────────────────────────────────────────────
// Kept intentionally short so Gemini Nano (small on-device model with a
// limited context window) can process them quickly. All instructions are
// combined into a single prompt call; no initialPrompts in the session.

const JSON_SCHEMA_EXAMPLE =
  '{"persons":[{"id":"p1","parentId":null,"name":"Name","role":"Title","department":null,"email":null,"employmentType":null}]}'

/**
 * Build a compact single-turn prompt for text org chart analysis.
 * ~220 chars of overhead — well within Gemini Nano's context window.
 */
function buildTextPrompt(text: string): string {
  return `Parse this org chart. Output ONLY valid JSON, no other text.
Format: ${JSON_SCHEMA_EXAMPLE}
Rules: ids p1,p2,p3... | parentId null for root | null for unknown fields

${text}`
}

/**
 * Compact prompt for the text part of multimodal (image) analysis.
 */
const IMAGE_PROMPT =
  `Analyze the org chart image. Output ONLY valid JSON, no other text.\n` +
  `Format: ${JSON_SCHEMA_EXAMPLE}\n` +
  `Rules: ids p1,p2,p3... | parentId null for root | null for unknown fields`

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 8000
/**
 * 30 s gives Gemini Nano enough headroom on slower devices while still
 * providing timely feedback if the model is stuck.
 */
const PROMPT_TIMEOUT_MS = 30_000

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize input text before sending to Gemini Nano.
 * Removes ASCII tree drawing characters and simplifies complex formatting
 * that small on-device models struggle with.
 */
function preprocessOrgText(text: string): string {
  return text
    .replace(/[├└]─+\s*/g, '- ')
    .replace(/│\s*/g, '  ')
    .replace(/　/g, ' ')
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

  const parentMap = new Map<string, string | null>(fixed.map((p) => [p.id, p.parentId ?? null]))
  const cycleBreakers = new Set<string>()

  for (const person of fixed) {
    if (parentMap.get(person.id) === null) continue
    const visited = new Set<string>()
    visited.add(person.id)
    let cursor: string | null = parentMap.get(person.id) ?? null
    while (cursor !== null) {
      if (visited.has(cursor)) { cycleBreakers.add(person.id); break }
      visited.add(cursor)
      cursor = parentMap.get(cursor) ?? null
    }
  }

  return fixed.map((p) => (cycleBreakers.has(p.id) ? { ...p, parentId: null } : p))
}

/** Race a prompt Promise against a timeout, converting port/channel errors to friendly messages. */
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

/** Parse and validate the raw JSON string returned by the model. */
function parseAndValidate(raw: string): ExtractedPerson[] {
  let parsed: unknown
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw.trim())
  } catch {
    throw new Error(
      'AIが無効なJSONを返しました。入力を確認して再試行してください。(Invalid JSON from Chrome AI)',
    )
  }
  const result = llmOutputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `解析結果の検証に失敗しました: ${result.error.issues[0]?.message ?? 'unknown'}`,
    )
  }
  return sanitizePersons(result.data.persons)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeImageWithChromeAI(file: File): Promise<ExtractedPerson[]> {
  if (typeof LanguageModel === 'undefined' || LanguageModel == null) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。')
  }
  const availability = await LanguageModel.availability()
  if (availability === 'unavailable') throw new Error('Gemini Nano はこのデバイスで利用できません。')
  if (availability === 'downloading') throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。')

  let session: ChromeLanguageModelSession
  try {
    session = await Promise.race([
      LanguageModel.create({
        expectedInputs: [{ type: 'image' }],
        expectedOutputs: [{ type: 'text', languages: ['ja'] }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')),
          60_000,
        ),
      ),
    ])
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
      session.prompt([IMAGE_PROMPT, { type: 'image', content: imageBitmap }]),
      '解析がタイムアウトしました（30秒超過）。画像をシンプルにして再試行してください。',
    )
    return parseAndValidate(raw)
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
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。')
  }
  const availability = await LanguageModel.availability()
  if (availability === 'unavailable') throw new Error('Gemini Nano はこのデバイスで利用できません。')
  if (availability === 'downloading') throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。')

  const processedText = preprocessOrgText(text)

  const session = await Promise.race([
    LanguageModel.create({
      expectedOutputs: [{ type: 'text', languages: ['ja'] }],
      // No initialPrompts — the compact buildTextPrompt() includes all instructions.
      // Keeping the session lean reduces model initialization time on slow devices.
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')),
        60_000,
      ),
    ),
  ])

  try {
    const raw = await withPromptTimeout(
      session.prompt(buildTextPrompt(processedText)),
      '解析がタイムアウトしました（30秒超過）。入力テキストを短くするか、シンプルな構造にして再試行してください。\nまだ解決しない場合はシークレットウィンドウ（Ctrl+Shift+N）でお試しください。',
    )
    return parseAndValidate(raw)
  } finally {
    session.destroy()
  }
}
