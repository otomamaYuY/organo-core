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
    // Pass expectedOutputs so Chrome doesn't log "No output language was specified"
    return await LanguageModel.availability({
      expectedOutputs: [{ type: 'text', languages: ['ja'] }],
    })
  } catch {
    return 'unsupported'
  }
}

// ── System prompts ───────────────────────────────────────────────────────────
// Compact but explicit — tells Gemini Nano to output ONLY JSON.
// Restored as initialPrompts to prevent the model generating explanatory text
// around the JSON (which breaks parsing and makes inference slower).

/**
 * Keep prompts short — Gemini Nano has a small context window and long system
 * prompts slow down session creation noticeably.
 *
 * Critical constraints explicitly stated:
 *   1. Output ONLY JSON (no prose / markdown around it)
 *   2. employmentType is an enum — list the allowed values so the model doesn't invent Japanese labels
 *   3. Use null (not "") for unknown fields — prevents Zod min(1) failures on role
 */
const SYSTEM_PROMPT = `Output ONLY JSON, no other text:
{"persons":[{"id":"p1","parentId":null,"name":"Name","role":"Title","department":null,"email":null,"employmentType":null}]}
Rules: ids p1,p2,p3... | parentId null for root | use null not "" for unknowns
employmentType must be null or one of: "full-time" "part-time" "contract" "intern" "advisor"`

const IMAGE_SYSTEM_PROMPT = `Output ONLY JSON, no other text:
{"persons":[{"id":"p1","parentId":null,"name":"Name","role":"Title","department":null,"email":null,"employmentType":null}]}
Rules: ids p1,p2,p3... | parentId null for root | use null not "" for unknowns
employmentType must be null or one of: "full-time" "part-time" "contract" "intern" "advisor"`

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 8000
/**
 * 120 s — generous upper bound for CPU-only Gemini Nano inference.
 * The elapsed-time counter in the UI keeps users informed while they wait.
 */
const PROMPT_TIMEOUT_MS = 120_000
const SESSION_TIMEOUT_MS = 60_000

// ── Debug logger ─────────────────────────────────────────────────────────────
// Gated behind DEV flag — HR data (names, roles) must not appear in production console.

const IS_DEV = import.meta.env.DEV

function elapsed(startMs: number): string {
  return `${((performance.now() - startMs) / 1000).toFixed(1)}s`
}

function dbg(msg: string): void {
  if (!IS_DEV) return
  // eslint-disable-next-line no-console
  console.log(`[ChromeAI] ${msg}`)
}

function dbgError(msg: string, err: unknown): void {
  if (!IS_DEV) return
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

/**
 * Multi-strategy JSON extraction.
 * Gemini Nano sometimes wraps the JSON in markdown fences or leading prose
 * despite the "Output ONLY JSON" instruction.
 *
 * Priority:
 *   1. Markdown fence  ```json ... ```  or  ``` ... ```
 *   2. Raw JSON if the trimmed string already starts with { or [
 *   3. First {...} or [...] found inside a prose response
 */
function extractJson(raw: string): unknown {
  // Strategy 1 — markdown code fence
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim())

  const trimmed = raw.trim()

  // Strategy 2 — entire response is already JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed)
  }

  // Strategy 3 — extract the first {...} block from prose (greedy, outermost)
  const objectMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (objectMatch) return JSON.parse(objectMatch[1])

  throw new Error('No JSON object found in model response')
}

function parseAndValidate(raw: string): ExtractedPerson[] {
  // Always log raw response so console output reveals exactly what the model returned
  dbg(`raw response (${raw.length} chars): ${raw.slice(0, 800)}`)
  if (raw.length > 800) dbg(`...response truncated (${raw.length} total chars)`)

  let parsed: unknown
  try {
    parsed = extractJson(raw)
  } catch (e) {
    const hint = raw.slice(0, 120).replace(/\n/g, '↵')
    dbgError('JSON extraction failed', e)
    dbg(`response head: ${hint}`)
    throw new Error(
      `AIが有効なJSONを返しませんでした。\n` +
      `先頭120文字: ${hint}\n` +
      `(${e instanceof Error ? e.message : String(e)})`,
    )
  }

  dbg(`parsed JSON: ${JSON.stringify(parsed).slice(0, 400)}`)

  const result = llmOutputSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues
    // Log each issue individually so the browser console shows full detail
    dbgError(`Zod validation failed — ${issues.length} issue(s):`, issues)
    issues.forEach((iss, i) => {
      dbg(`  [${i + 1}] path=${iss.path.join('.')} code=${iss.code} message=${iss.message}`)
    })
    dbg(`  parsed root keys: ${Object.keys(parsed as object).join(', ')}`)
    const detail = issues
      .slice(0, 5)
      .map((iss) => `${iss.path.join('.') || '?'}: ${iss.message}`)
      .join('; ')
    throw new Error(
      `解析結果の検証に失敗しました（${issues.length}件）。\n詳細: ${detail}`,
    )
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
