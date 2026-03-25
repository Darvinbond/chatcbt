import { openai } from '@ai-sdk/openai'
import { BaseAiService } from '@/services/ai/ai-service-base'

const DEFAULT_MODEL = 'gpt-4o'

export class OpenAiService extends BaseAiService {
  constructor(modelId = process.env.OPENAI_MODEL ?? DEFAULT_MODEL) {
    const model = openai(modelId)
    super(model, model, {
      providerOptions: {
        // Mirrors Gemini `structuredOutputs` — constrains generation to the Zod/JSON schema where the model supports it.
        openai: {
          structuredOutputs: true,
          strictJsonSchema: true
        }
      }
    })
  }
}
