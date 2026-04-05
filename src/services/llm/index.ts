import { analyzeImageWithOpenAI } from './openai'
import type { ExtractedPerson } from './schema'

interface LlmCredentials {
  provider: 'openai' | 'bedrock' | 'azure-openai'
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
      // Future: implement Azure OpenAI client
      throw new Error('Azure OpenAI support coming soon. Please use OpenAI for now.')
    case 'bedrock':
      // Future: implement via Cloudflare Worker proxy
      throw new Error('Amazon Bedrock support coming soon. Please use OpenAI for now.')
  }
}

export type { ExtractedPerson } from './schema'
