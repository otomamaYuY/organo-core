import { create } from 'zustand'

export type LlmProvider = 'bedrock' | 'openai' | 'azure-openai'

interface BedrockCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

interface OpenAICredentials {
  apiKey: string
}

interface AzureOpenAICredentials {
  apiKey: string
  endpoint: string
}

interface LlmSettingsState {
  provider: LlmProvider
  bedrock: BedrockCredentials
  openai: OpenAICredentials
  azureOpenai: AzureOpenAICredentials
  setProvider: (provider: LlmProvider) => void
  updateBedrock: (creds: Partial<BedrockCredentials>) => void
  updateOpenai: (creds: Partial<OpenAICredentials>) => void
  updateAzureOpenai: (creds: Partial<AzureOpenAICredentials>) => void
  saveToStorage: () => void
  clearAll: () => void
  isConfigured: () => boolean
}

const STORAGE_KEY = 'organo-llm-settings'

const defaultBedrock: BedrockCredentials = { accessKeyId: '', secretAccessKey: '', region: 'us-east-1' }
const defaultOpenai: OpenAICredentials = { apiKey: '' }
const defaultAzureOpenai: AzureOpenAICredentials = { apiKey: '', endpoint: '' }

const SUPPORTED_PROVIDERS: LlmProvider[] = ['openai']

function loadFromStorage(): Pick<LlmSettingsState, 'provider' | 'bedrock' | 'openai' | 'azureOpenai'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { provider: 'openai', bedrock: defaultBedrock, openai: defaultOpenai, azureOpenai: defaultAzureOpenai }
    const parsed = JSON.parse(raw)
    // If a previously saved provider is no longer supported, fall back to openai
    const savedProvider: LlmProvider = parsed.provider ?? 'openai'
    const provider = SUPPORTED_PROVIDERS.includes(savedProvider) ? savedProvider : 'openai'
    return {
      provider,
      bedrock: { ...defaultBedrock, ...parsed.bedrock },
      openai: { ...defaultOpenai, ...parsed.openai },
      azureOpenai: { ...defaultAzureOpenai, ...parsed.azureOpenai },
    }
  } catch {
    return { provider: 'openai', bedrock: defaultBedrock, openai: defaultOpenai, azureOpenai: defaultAzureOpenai }
  }
}

const initial = loadFromStorage()

export const useLlmSettingsStore = create<LlmSettingsState>((set, get) => ({
  ...initial,

  setProvider: (provider) => set({ provider }),

  updateBedrock: (creds) =>
    set((s) => ({ bedrock: { ...s.bedrock, ...creds } })),

  updateOpenai: (creds) =>
    set((s) => ({ openai: { ...s.openai, ...creds } })),

  updateAzureOpenai: (creds) =>
    set((s) => ({ azureOpenai: { ...s.azureOpenai, ...creds } })),

  saveToStorage: () => {
    const { provider, bedrock, openai, azureOpenai } = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, bedrock, openai, azureOpenai }))
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ provider: 'bedrock', bedrock: defaultBedrock, openai: defaultOpenai, azureOpenai: defaultAzureOpenai })
  },

  isConfigured: () => {
    const { provider, bedrock, openai, azureOpenai } = get()
    switch (provider) {
      case 'bedrock':
        return !!(bedrock.accessKeyId && bedrock.secretAccessKey && bedrock.region)
      case 'openai':
        return !!openai.apiKey
      case 'azure-openai':
        return !!(azureOpenai.apiKey && azureOpenai.endpoint)
    }
  },
}))
