import { llmOutputSchema, type ExtractedPerson } from './schema'

declare global {
  interface Window {
    ai?: {
      languageModel?: ChromeLanguageModelAPI
    }
  }
}

interface ChromeLanguageModelAPI {
  availability(): Promise<'readily' | 'after-download' | 'no'>
  create(options?: { systemPrompt?: string }): Promise<ChromeLanguageModelSession>
}

interface ChromeLanguageModelSession {
  prompt(input: string): Promise<string>
  destroy(): void
}

export type ChromeAiAvailability = 'readily' | 'after-download' | 'no' | 'unsupported'

export async function getChromeAiAvailability(): Promise<ChromeAiAvailability> {
  if (typeof window === 'undefined') return 'unsupported'
  const api = window.ai?.languageModel
  if (!api) return 'unsupported'
  try {
    return await api.availability()
  } catch {
    return 'unsupported'
  }
}

export async function isChromeAiAvailable(): Promise<boolean> {
  const a = await getChromeAiAvailability()
  return a === 'readily' || a === 'after-download'
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

export async function analyzeTextWithChromeAI(text: string): Promise<ExtractedPerson[]> {
  const api = window.ai?.languageModel
  if (!api) {
    throw new Error('Chrome Built-in AI はこのブラウザで利用できません。(Chrome Built-in AI is not available in this browser.)')
  }

  const availability = await api.availability()
  if (availability === 'no') {
    throw new Error('Gemini Nano はこのデバイスで利用できません。(Gemini Nano is not available on this device.)')
  }

  const session = await api.create({ systemPrompt: SYSTEM_PROMPT })

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

    return result.data.persons
  } finally {
    session.destroy()
  }
}
