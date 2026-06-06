import { llmOutputSchema, type ExtractedPerson } from './schema'

interface ChromeLanguageModelImageInput {
  type: 'image'
  content: ImageBitmap
}

interface ChromeLanguageModelCreateOptions {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>
  /** 0 = deterministic (greedy). Default: 1.0 */
  temperature?: number
  /** Number of top tokens to sample from. 1 = greedy decoding. Default: 3 */
  topK?: number
}

interface ChromeLanguageModelSession {
  prompt(input: string | Array<string | ChromeLanguageModelImageInput>): Promise<string>
  destroy(): void
  /** Available in some Chrome versions — context window usage stats */
  readonly tokensLeft?: number
  readonly tokensSoFar?: number
  readonly maxTokens?: number
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

// ── System prompts ───────────────────────────────────────────────────────────
// Compact but explicit — tells Gemini Nano to output ONLY JSON.
// Restored as initialPrompts to prevent the model generating explanatory text
// around the JSON (which breaks parsing and makes inference slower).

const SYSTEM_PROMPT = `You parse org charts into JSON. Output ONLY this format, no other text:
{"persons":[{"id":"p1","parentId":null,"name":"Name","role":"Title or null","department":null,"email":null,"employmentType":null}]}
Rules: sequential ids (p1,p2,...) | parentId null for root | null for unknown fields`

const IMAGE_SYSTEM_PROMPT = `You parse org chart images into JSON. Output ONLY this format, no other text:
{"persons":[{"id":"p1","parentId":null,"name":"Name","role":"Title or null","department":null,"email":null,"employmentType":null}]}
Rules: sequential ids (p1,p2,...) | parentId null for root | null for unknown fields`

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 8000
/**
 * 120 s — generous upper bound for CPU-only Gemini Nano inference.
 * The elapsed-time counter in the UI keeps users informed while they wait.
 */
const PROMPT_TIMEOUT_MS = 120_000
const SESSION_TIMEOUT_MS = 60_000

// ── Debug logger ─────────────────────────────────────────────────────────────

function elapsed(startMs: number): string {
  return `${((performance.now() - startMs) / 1000).toFixed(1)}s`
}

function dbg(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[ChromeAI] ${msg}`)
}

function dbgError(msg: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.error(
    `[ChromeAI] ${msg}`,
    err instanceof Error ? `${err.name}: ${err.message}` : err,
  )
}

function logSessionInfo(session: ChromeLanguageModelSession): void {
  if (
    typeof session.tokensLeft === 'number' ||
    typeof session.tokensSoFar === 'number' ||
    typeof session.maxTokens === 'number'
  ) {
    dbg(
      `context window — maxTokens:${session.maxTokens ?? '?'} ` +
      `used:${session.tokensSoFar ?? '?'} ` +
      `left:${session.tokensLeft ?? '?'}`,
    )
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function preprocessOrgText(text: string): string {
  return text
    .replace(/[├└]─+\s*/g, '- ')
    .replace(/│\s*/g, '  ')
    .replace(/　/g, ' ')
    .replace(/ {3,}/g, '  ')
    .trim()
}

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

function parseAndValidate(raw: string): ExtractedPerson[] {
  let parsed: unknown
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : raw.trim())
  } catch (e) {
    dbgError('JSON parse failed. Raw response:', raw.slice(0, 300))
    throw new Error('AIが無効なJSONを返しました。入力を確認して再試行してください。(Invalid JSON from Chrome AI)')
  }
  const result = llmOutputSchema.safeParse(parsed)
  if (!result.success) {
    dbgError('Zod validation failed:', result.error.issues)
    throw new Error(`解析結果の検証に失敗しました: ${result.error.issues[0]?.message ?? 'unknown'}`)
  }
  return sanitizePersons(result.data.persons)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeImageWithChromeAI(file: File): Promise<ExtractedPerson[]> {
  const t0 = performance.now()
  dbg(`analyzeImage() start — file: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`)

  if (typeof LanguageModel === 'undefined' || LanguageModel == null) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。')
  }

  const availability = await LanguageModel.availability()
  dbg(`availability: ${availability}`)
  if (availability === 'unavailable') throw new Error('Gemini Nano はこのデバイスで利用できません。')
  if (availability === 'downloading') throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。')

  let session: ChromeLanguageModelSession
  const sessionOpts = {
    expectedInputs: [{ type: 'image' as const }],
    expectedOutputs: [{ type: 'text' as const, languages: ['ja'] }],
    initialPrompts: [{ role: 'system' as const, content: IMAGE_SYSTEM_PROMPT }],
    temperature: 0,
    topK: 1,
  }
  dbg(`creating session — opts: ${JSON.stringify({ ...sessionOpts, initialPrompts: '[omitted]' })}`)

  try {
    session = await Promise.race([
      LanguageModel.create(sessionOpts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')), SESSION_TIMEOUT_MS),
      ),
    ])
  } catch (err) {
    dbgError(`session creation failed after ${elapsed(t0)}`, err)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('タイムアウト')) throw err
    throw new Error('画像入力セッションの作成に失敗しました。Chrome を最新版に更新し、chrome://flags で "Prompt API for Gemini Nano" を有効にしてください。')
  }

  dbg(`session ready in ${elapsed(t0)}`)
  logSessionInfo(session)

  let imageBitmap: ImageBitmap | null = null
  try {
    imageBitmap = await createImageBitmap(file)
    const t1 = performance.now()
    dbg('prompt start (image)')

    const raw = await withPromptTimeout(
      session.prompt(['以下の組織図画像を解析してJSONを返してください。', { type: 'image', content: imageBitmap }]),
      '解析がタイムアウトしました（120秒超過）。画像をシンプルにして再試行してください。',
    )

    dbg(`prompt complete in ${elapsed(t1)} — response length: ${raw.length} chars`)
    logSessionInfo(session)

    return parseAndValidate(raw)
  } catch (err) {
    dbgError(`analyzeImage failed after ${elapsed(t0)}`, err)
    throw err
  } finally {
    imageBitmap?.close()
    session.destroy()
  }
}

export async function analyzeTextWithChromeAI(text: string): Promise<ExtractedPerson[]> {
  const t0 = performance.now()
  dbg(`analyzeText() start — input length: ${text.length} chars`)

  if (text.length > MAX_INPUT_CHARS) {
    throw new Error(`入力テキストが長すぎます（上限 ${MAX_INPUT_CHARS} 文字）。短くしてから再試行してください。`)
  }
  if (typeof LanguageModel === 'undefined' || LanguageModel == null) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。')
  }

  const availability = await LanguageModel.availability()
  dbg(`availability: ${availability}`)
  if (availability === 'unavailable') throw new Error('Gemini Nano はこのデバイスで利用できません。')
  if (availability === 'downloading') throw new Error('Gemini Nano はダウンロード中です。しばらく待ってから再試行してください。')

  const processedText = preprocessOrgText(text)
  dbg(`preprocessed length: ${processedText.length} chars`)

  const sessionOpts = {
    expectedOutputs: [{ type: 'text' as const, languages: ['ja'] }],
    initialPrompts: [{ role: 'system' as const, content: SYSTEM_PROMPT }],
    temperature: 0,
    topK: 1,
  }
  dbg(`creating session — opts: ${JSON.stringify({ ...sessionOpts, initialPrompts: '[omitted]' })}`)

  let session: ChromeLanguageModelSession
  try {
    session = await Promise.race([
      LanguageModel.create(sessionOpts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('モデルの初期化がタイムアウトしました。しばらく待ってから再試行してください。')), SESSION_TIMEOUT_MS),
      ),
    ])
  } catch (err) {
    dbgError(`session creation failed after ${elapsed(t0)}`, err)
    throw err
  }

  dbg(`session ready in ${elapsed(t0)}`)
  logSessionInfo(session)

  const userMsg = `Org chart:\n${processedText}`
  dbg(`prompt start — user message length: ${userMsg.length} chars`)

  try {
    const t1 = performance.now()
    const raw = await withPromptTimeout(
      session.prompt(userMsg),
      '解析がタイムアウトしました（120秒超過）。入力テキストを短くするか、シンプルな構造にして再試行してください。\nまだ解決しない場合はシークレットウィンドウ（Ctrl+Shift+N）でお試しください。',
    )

    dbg(`prompt complete in ${elapsed(t1)} — response length: ${raw.length} chars`)
    logSessionInfo(session)

    return parseAndValidate(raw)
  } catch (err) {
    dbgError(`analyzeText failed after ${elapsed(t0)}`, err)
    throw err
  } finally {
    session.destroy()
  }
}
