import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiResponseBuilder } from '@/lib/api/response'
import { GeminiService } from '@/services/ai/gemini.service'

const ProcessRequestSchema = z.object({
  content: z.string(),
  mode: z.enum(['text', 'spreadsheet']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ProcessRequestSchema.parse(body)
    
    const geminiService = new GeminiService()
    const result = await geminiService.parseContent(validated.content, validated.mode)
    
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
