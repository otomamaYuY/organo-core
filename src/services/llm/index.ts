import { analyzeTextWithChromeAI } from './chrome-ai'

export async function importGraphFromText(text: string): Promise<ExtractedPerson[]> {
  return analyzeTextWithChromeAI(text)
}

export type { ExtractedPerson } from './schema'
