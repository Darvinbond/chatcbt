import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Question schema for validation
const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean()
  })),
  type: z.enum(['multiple-choice', 'true-false', 'fill-blank']),
  points: z.number().default(1)
})

const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema)
})

export class GeminiService {
  async parseContent(content: string, mode: 'text' | 'spreadsheet'): Promise<any> {
    const prompt = this.buildPrompt(content, mode)
    
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    question: { type: 'string' },
                    options: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          text: { type: 'string' },
                          isCorrect: { type: 'boolean' }
                        },
                        required: ['id', 'text', 'isCorrect']
                      }
                    },
                    type: { 
                      type: 'string', 
                      enum: ['multiple-choice', 'true-false', 'fill-blank'] 
                    },
                    points: { type: 'number' }
                  },
                  required: ['id', 'question', 'options', 'type', 'points']
                }
              }
            },
            required: ['questions']
          }
        }
      })

      const text = response.text
      const parsed = JSON.parse(text ?? "")
      return QuestionsResponseSchema.parse(parsed)
    } catch (error) {
      console.error('AI parsing error:', error)
      throw new Error('Failed to parse content')
    }
  }

  private buildPrompt(content: string, mode: string): string {
    return `
Parse the following ${mode === 'spreadsheet' ? 'spreadsheet data' : 'text content'} and convert it into a JSON format for a computer-based test.

Instructions:
- Generate unique string IDs for each question and option
- For multiple-choice questions, include 3-4 options with only one correct answer
- For true-false questions, include exactly 2 options (true/false)
- For fill-blank questions, create options that represent possible answers
- Set appropriate point values (default 1 point per question)
- Ensure all required fields are present

Content to parse:
${content}
`
  }

  async getTestInsights(test: any, query: string, history: any[]): Promise<any> {
    const prompt = this.buildTestInsightsPrompt(test, query, history);
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
      });
      return { response: response.text ?? "" };
    } catch (error) {
      console.error('AI insights error:', error);
      throw new Error('Failed to get insights');
    }
  }

  private buildTestInsightsPrompt(test: any, query: string, history: any[]): string {
    const historyString = history
      .map((msg) => `${String(msg.sender)}: ${String(msg.content)}`)
      .join('\n');

    const title = String(test.title || '');
    const description = String(test.description || '');
    const duration = String(test.duration || '');
    const questions = JSON.stringify(test.questions, null, 2) || '';
    const students = JSON.stringify(test.students, null, 2) || '';
    const attempts = JSON.stringify(test.attempts, null, 2) || '';
    const userQuery = String(query || '');

    return `
You are an AI assistant for a computer-based test platform. Your role is to provide insights about a specific test.
You can not take any action, you can only provide insights. If the user asks you to take an action, you should politely decline and remind them of your role.

Here is the data for the test:
- Test Title: ${title}
- Test Description: ${description}
- Test Duration: ${duration} minutes
- Total Questions: ${JSON.parse(questions).length}
- Total Students: ${JSON.parse(students).length}
- Total Attempts: ${JSON.parse(attempts).length}
- Questions: ${questions}
- Students: ${students}
- Attempts: ${attempts}

Here is the conversation history:
${historyString}

The user's query is: "${userQuery}"

Please provide a concise and helpful response to the user's query based on the provided data and conversation history.
`;
  }
}
