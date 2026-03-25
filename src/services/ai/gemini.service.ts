import { google } from '@ai-sdk/google'
import { BaseAiService } from '@/services/ai/ai-service-base'

const DEFAULT_MODEL = 'models/gemini-2.5-flash'

export class GeminiService extends BaseAiService {
  constructor(modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL) {
    const model = google(modelId)
    super(model, model, {
      providerOptions: {
        google: { structuredOutputs: true }
      }
    })
  }
}
