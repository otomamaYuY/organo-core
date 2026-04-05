import { llmOutputSchema, type ExtractedPerson } from './schema'
import { SYSTEM_PROMPT, USER_PROMPT } from './prompt'

interface OpenAICredentials {
  apiKey: string
}

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
      >
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null
    }
  }>
}

function classifyOpenAIError(status: number, message: string): string {
  if (status === 401) {
    return 'APIキーが無効です。AI設定を確認してください。(Invalid API key — check your AI Settings)'
  }
  if (status === 429) {
    if (message.toLowerCase().includes('quota')) {
      return 'OpenAIのクォータ上限に達しました。プランを確認してください。(Quota exceeded)'
    }
    return 'リクエストが多すぎます。しばらく待ってから再試行してください。(Rate limit exceeded)'
  }
  if (status === 400) {
    return '画像の読み取りに失敗しました。より鮮明な画像をお試しください。(Image could not be processed — try a clearer image)'
  }
  if (status >= 500) {
    return 'OpenAIサーバーでエラーが発生しました。しばらく後に再試行してください。(OpenAI server error)'
  }
  return `APIエラーが発生しました (${status}): ${message || 'Unknown error'}`
}

export async function analyzeImageWithOpenAI(
  base64: string,
  mimeType: string,
  creds: OpenAICredentials,
): Promise<ExtractedPerson[]> {
  const messages: OpenAIChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: 'high',
          },
        },
        { type: 'text', text: USER_PROMPT },
      ],
    },
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const apiMessage = (errorBody as { error?: { message?: string } }).error?.message ?? ''
    throw new Error(classifyOpenAIError(response.status, apiMessage))
  }

  const data = (await response.json()) as OpenAIResponse
  const raw = data.choices[0]?.message?.content

  if (!raw) throw new Error('OpenAI returned empty response')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  const result = llmOutputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Response validation failed: ${result.error.issues[0]?.message ?? 'unknown'}`)
  }

  return result.data.persons
}
