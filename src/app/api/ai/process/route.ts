import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiResponseBuilder } from '@/lib/api/response'
import { createAiService } from '@/services/ai'

const ProcessRequestSchema = z.object({
  content: z.string(),
  mode: z.enum(['text', 'spreadsheet']),
  /** objective = choice only; theory = written only; mixed = both in one run (respects counts in the prompt). */
  questionKind: z.enum(['objective', 'theory', 'mixed']).optional().default('mixed'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ProcessRequestSchema.parse(body)
    
    const ai = createAiService()
    let result: { questions: unknown[] }
    if (validated.questionKind === 'theory') {
      result = await ai.parseTheoryQuestions(validated.content)
    } else if (validated.questionKind === 'objective') {
      result = await ai.parseContent(validated.content, validated.mode)
    } else {
      result = await ai.parseMixedTestQuestions(validated.content, validated.mode)
    }
    
    return ApiResponseBuilder.success(result)
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return ApiResponseBuilder.error('VALIDATION_ERROR', 'Invalid input', 400)
    }
    
    console.error('AI processing error:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'Failed to process content', 500)
  }
}
