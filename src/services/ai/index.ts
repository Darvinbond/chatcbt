import { BaseAiService } from '@/services/ai/ai-service-base'
import { GeminiService } from '@/services/ai/gemini.service'
import { OpenAiService } from '@/services/ai/openai.service'

export type AiProvider = 'gemini' | 'openai'

/**
 * Active LLM backend. Set in .env:
 * - AI_PROVIDER=gemini | openai (default: gemini)
 * - GEMINI_MODEL=models/gemini-2.5-flash (optional; Google / GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY)
 * - OPENAI_MODEL=gpt-4o (optional; requires OPENAI_API_KEY)
 */
export function createAiService(): BaseAiService {
  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase().trim() as AiProvider

  switch (provider) {
    case 'openai':
      return new OpenAiService()
    case 'gemini':
    default:
      return new GeminiService()
  }
}

export { BaseAiService, GeminiService, OpenAiService }
export type { ChatHistoryEntry, ObjectGenerationConfig } from '@/services/ai/ai-service-base'
