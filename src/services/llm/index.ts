import { analyzeImageWithOpenAI } from './openai'
import { analyzeTextWithChromeAI } from './chrome-ai'
import type { ExtractedPerson } from './schema'

interface LlmCredentials {
  provider: 'openai' | 'bedrock' | 'azure-openai' | 'chrome-ai'
  openai: { apiKey: string }
  bedrock: { accessKeyId: string; secretAccessKey: string; region: string }
  azureOpenai: { apiKey: string; endpoint: string }
}

export async function importGraphFromImage(
  base64: string,
  mimeType: string,
  creds: LlmCredentials,
): Promise<ExtractedPerson[]> {
  switch (creds.provider) {
    case 'openai':
      return analyzeImageWithOpenAI(base64, mimeType, creds.openai)
    case 'azure-openai':
      throw new Error('Azure OpenAI support coming soon. Please use OpenAI for now.')
    case 'bedrock':
      throw new Error('Amazon Bedrock support coming soon. Please use OpenAI for now.')
    case 'chrome-ai':
      throw new Error('Chrome AI does not support image input. Use importGraphFromText instead.')
  }
}

export async function importGraphFromText(text: string): Promise<ExtractedPerson[]> {
  return analyzeTextWithChromeAI(text)
}

export type { ExtractedPerson } from './schema'
