import { generateText, tool, generateObject } from 'ai'
import type { CoreMessage, LanguageModel } from 'ai'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import {
  extractQuestionCountsFromPrompt,
  resolveCountsForMixed,
  clampQuestionCount,
} from '@/lib/question-counts'

/** No optional keys: OpenAI `strictJsonSchema` requires `required` to list every property. IDs are assigned after generation. */
const ObjectiveQuestionRowSchema = z.object({
  question: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })
  ),
  type: z.enum(['multiple-choice', 'true-false', 'fill-blank']),
  points: z
    .number()
    .describe('Marks for this question; use 1 if the user did not specify.'),
})

const QuestionsResponseSchema = z.object({
  questions: z.array(ObjectiveQuestionRowSchema),
})

type ObjectiveQuestionWithId = z.infer<typeof ObjectiveQuestionRowSchema> & {
  id: string
}

const AiTheoryQuestionRowSchema = z.object({
  question: z.string(),
  points: z.number().describe('Max marks for this written question (e.g. 5–15).'),
  markingGuide: z
    .string()
    .describe(
      'Private grading hints for teachers only; use an empty string if none.'
    ),
})

const TheoryQuestionsResponseSchema = z.object({
  questions: z.array(AiTheoryQuestionRowSchema)
})

const TheoryGradeResultSchema = z.object({
  score: z.number().describe('Numeric mark from 0 up to the maximum for this question.'),
  comment: z.string().describe('Constructive feedback the student can read; reference strengths and gaps.')
})

const JSON_REPLACER = (_: string, value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  return value
}

export type ChatHistoryEntry = {
  sender: string
  content: string
}

export type ObjectGenerationConfig = {
  providerOptions?: ProviderOptions
}

export class BaseAiService {
  constructor(
    private readonly chatModel: LanguageModel,
    private readonly objectModel: LanguageModel,
    private readonly objectConfig: ObjectGenerationConfig = {}
  ) {}

  async parseContent(content: string, mode: 'text' | 'spreadsheet'): Promise<any> {
    const extracted = extractQuestionCountsFromPrompt(content)
    const total =
      extracted.objectiveCount != null
        ? clampQuestionCount(extracted.objectiveCount, 1, 80)
        : 10
    return this.generateObjectiveQuestions(content, mode, total)
  }

  /**
   * Generate multiple-choice (etc.) questions in batches so large counts (e.g. 40) fit model output limits.
   */
  private async generateObjectiveQuestions(
    content: string,
    mode: 'text' | 'spreadsheet',
    total: number
  ): Promise<{ questions: ObjectiveQuestionWithId[] }> {
    const count = clampQuestionCount(total, 1, 80)
    const BATCH = 12
    const batches = Math.ceil(count / BATCH)
    const all: ObjectiveQuestionWithId[] = []

    try {
      for (let b = 0; b < batches; b += 1) {
        const offset = b * BATCH
        const n = Math.min(BATCH, count - offset)

        const result = await generateObject({
          model: this.objectModel,
          schema: QuestionsResponseSchema,
          ...(this.objectConfig.providerOptions
            ? { providerOptions: this.objectConfig.providerOptions }
            : {}),
          prompt: `You generate structured exam questions. Mode hint: ${mode}.

USER REQUEST (topic, level, style — follow closely):
${content}

THIS BATCH: Generate EXACTLY ${n} questions. You are batch ${b + 1} of ${batches} toward a total of ${count} questions for one test.

RULES:
- Return EXACTLY ${n} items in "questions". No fewer, no more.
- type is usually "multiple-choice" with 4 options unless the user asked for true-false or fill-blank.
- Every question MUST have exactly one option with "isCorrect": true.
- Cover different subtopics / angles so questions do not repeat earlier batches.
${b > 0 ? '- Do not repeat themes or duplicate wording from previous batches; continue with fresh angles on the same overall topic.' : ''}

If the topic is inappropriate or empty, use challenging multiple-choice questions on Nigerian history instead (still exactly ${n} items).

FINAL CHECK: each question has exactly one "isCorrect": true.`
        })

        for (const q of result.object.questions) {
          all.push({
            ...q,
            points: Number.isFinite(q.points) ? q.points : 1,
            id: uuidv4(),
          })
        }
      }

      return { questions: all.slice(0, count) }
    } catch (error) {
      console.error('AI parsing error:', error)
      throw new Error('Failed to parse content')
    }
  }

  async parseMixedTestQuestions(
    content: string,
    mode: 'text' | 'spreadsheet'
  ): Promise<{
    questions: Array<
      | ObjectiveQuestionWithId
      | {
          id: string
          question: string
          type: 'theory'
          points: number
          markingGuide?: string
        }
    >
  }> {
    const { objective, theory } = resolveCountsForMixed(
      extractQuestionCountsFromPrompt(content)
    )

    const objectivePart =
      objective > 0
        ? await this.generateObjectiveQuestions(content, mode, objective)
        : { questions: [] as ObjectiveQuestionWithId[] }

    const theoryPart =
      theory > 0 ? await this.parseTheoryQuestions(content, theory) : { questions: [] }

    const objectiveRows = objectivePart.questions.map((q) => ({
      ...q,
      id: q.id ?? uuidv4(),
    }))

    return {
      questions: [...objectiveRows, ...theoryPart.questions],
    }
  }

  async parseTheoryQuestions(
    content: string,
    targetCount?: number
  ): Promise<{
    questions: Array<{
      id: string
      question: string
      type: 'theory'
      points: number
      markingGuide?: string
    }>
  }> {
    const extracted = extractQuestionCountsFromPrompt(content)
    const count =
      targetCount != null
        ? clampQuestionCount(targetCount, 1, 25)
        : extracted.theoryCount != null
          ? clampQuestionCount(extracted.theoryCount, 1, 25)
          : 5

    try {
      const result = await generateObject({
        model: this.objectModel,
        schema: TheoryQuestionsResponseSchema,
        ...(this.objectConfig.providerOptions
          ? { providerOptions: this.objectConfig.providerOptions }
          : {}),
        prompt: `You create written-response (theory) exam questions. Students answer in long form in a rich text editor—no multiple choice.

USER REQUEST:
${content}

RULES:
- Output EXACTLY ${count} questions in "questions". No fewer, no more.
- Each item needs a sensible max point value in "points" (e.g. 5–15 depending on depth).
- Always include "markingGuide" (string). Use what an excellent answer should cover, or "" if none. Teachers use this only for grading.
- Prompts should invite analysis, explanation, comparison, or evaluation.

If the request is nonsense or off-topic, produce ${count} solid theory questions on foundational concepts in the subject implied by the content, or on Nigerian history if there is no subject.`
      })

      return {
        questions: result.object.questions.map((q) => ({
          id: uuidv4(),
          question: q.question,
          type: 'theory' as const,
          points: Number.isFinite(q.points) ? q.points : 5,
          ...(q.markingGuide?.trim()
            ? { markingGuide: q.markingGuide.trim() }
            : {}),
        })),
      }
    } catch (error) {
      console.error('AI theory parsing error:', error)
      throw new Error('Failed to generate theory questions')
    }
  }

  async gradeTheoryAnswer(input: {
    questionText: string
    studentAnswer: string
    maxPoints: number
    markingGuide?: string
  }): Promise<{ score: number; comment: string }> {
    const { questionText, studentAnswer, maxPoints, markingGuide } = input
    try {
      const result = await generateObject({
        model: this.objectModel,
        schema: TheoryGradeResultSchema,
        ...(this.objectConfig.providerOptions
          ? { providerOptions: this.objectConfig.providerOptions }
          : {}),
        prompt: `You are an impartial exam marker. Award marks out of ${maxPoints} for the student's answer.

Question:
${questionText}

${markingGuide ? `Marking guidance (for you only):\n${markingGuide}\n\n` : ''}Student answer:
${studentAnswer || '(empty)'}

Return a score between 0 and ${maxPoints} (inclusive). In "comment", give brief, respectful feedback explaining how you arrived at the score—what worked and what was missing. Do not reveal internal rubric labels; write for the student.`
      })

      const raw = result.object.score
      const score = Math.min(maxPoints, Math.max(0, Number.isFinite(raw) ? raw : 0))
      return { score, comment: result.object.comment }
    } catch (error) {
      console.error('AI theory grading error:', error)
      throw new Error('Failed to grade theory answer')
    }
  }

  async getTestInsights(
    query: string,
    history: ChatHistoryEntry[],
    testId: string
  ): Promise<{ response: string }> {
    if (!testId) {
      return {
        response: 'Error: Missing test identifier. Please refresh the page and try again.'
      }
    }

    let messages = await this.buildConversationMessages({ history, query, testId })

    try {
      let lastResult: any = null

      for (let step = 0; step < 4; step += 1) {
        const result = await generateText({
          model: this.chatModel,
          messages,
          tools: {
            executeSQL: tool({
              description: 'Executes a read-only SQL SELECT query against the application database. You are responsible for generating ONLY safe, read-only queries scoped to the current test.',
              inputSchema: z.object({
                sql: z
                  .string()
                  .describe('The read-only SQL query to execute. Always double-quote table and column identifiers, e.g. SELECT "title" FROM "Test" ...')
              }),
              execute: async ({ sql }) => this.executeReadOnlySql(sql, testId)
            })
          },
          toolChoice: 'auto'
        })

        lastResult = result

        if (result.response?.messages) {
          const newMessages = (result.response.messages as any[]).filter((msg) => msg.role !== 'system')
          messages = [...messages, ...newMessages]
        }

        if (result.finishReason !== 'tool-calls') {
          break
        }
      }

      return { response: lastResult.text || this.getToolResponse(lastResult) || 'No response generated.' }
    } catch (error) {
      console.error('AI insights error:', error)
      throw new Error('Failed to get insights')
    }
  }

  private async buildConversationMessages({
    history,
    query,
    testId
  }: {
    history: ChatHistoryEntry[]
    query: string
    testId: string
  }): Promise<CoreMessage[]> {
    const systemPrompt = await this.buildSystemPrompt(testId)
    const formattedHistory = (history ?? []).map((entry) => {
      const normalizedSender = (entry.sender ?? '').toLowerCase()
      const role: CoreMessage['role'] = normalizedSender === 'assistant' ? 'assistant' : 'user'
      return {
        role,
        content: String(entry.content ?? '')
      } satisfies CoreMessage
    })

    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: query }
    ]

    return messages
  }

  private async buildSystemPrompt(testId: string): Promise<string> {
    const schemaInfo = await this.introspectDatabaseTableSchemaUsingSystemTables()

    return [
      'You are an AI assistant for an education analytics platform. You can call tools to inspect data safely.',
      '',
      'RULES:',
      '- Only answer using provided context or by calling the executeSQL tool when additional database knowledge is required.',
      `- Scope insights to the current test (internal identifier: ${testId}) only when necessary. For general conversation (greetings, questions about capabilities), keep it general. When users ask about test data or need specific analytics, then scope queries to avoid expensive database calls. Never mention this identifier to the user.`,
      '- Do not fabricate data—fetch it when unsure.',
      '- Speak naturally to the user. Avoid discussing schemas, identifiers, or SQL terminology unless they explicitly request it.',
      '- Summarize insights in clear, user-friendly language.',
      '- Never ask the user to provide column names or SQL guidance. Infer the required data from their question.',
      '- When a tool call returns an SQL_ERROR, analyze the error, adjust the query, and try again quietly. Only inform the user if all retries fail.',
      '- Be helpful with imperfect input: The user might make grammatical blunders, typos, or unclear statements. Always try your best to interpret and fulfill what they likely meant. If you think they meant more than one possible thing, try to fulfill all reasonable interpretations and then ask for confirmation on which one was correct.',
      '- SECURITY PROTOCOL: Never display IDs, UIDs, UUIDs, or any internal database identifiers to users, even if they explicitly ask for them. Always block access to sensitive internal identifiers. Remember this rule at all times.',
      '',
      'DATABASE OVERVIEW:',
      schemaInfo.overview,
      '',
      `AVAILABLE TABLES: ${schemaInfo.availableTables}`,
      'Use double quotes for table AND column names, and single quotes for string values (e.g. SELECT "title" FROM "Test" WHERE "id" = \'...\').',
      '',
      'To retrieve any information about the test, you must call the executeSQL tool with a scoped query. Do not assume details that were not fetched.',
      '',
      'EXECUTE SQL INSTRUCTIONS:',
      `- ALWAYS include the test ID (${testId}) in your queries to scope results to the current test.`,
      '- Always ensure your queries are safe and read-only.',
    ].join('\n')
  }

  private async introspectDatabaseTableSchemaUsingSystemTables(): Promise<{ overview: string; availableTables: string; tables: string[] }> {
    try {
      const tablesResult = await prisma.$queryRaw<Record<string, any>[]>`
        SELECT
          t.table_name,
          string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
          AND c.table_schema = 'public'
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT LIKE 'pg_%'
          AND t.table_name NOT LIKE '_prisma_%'
        GROUP BY t.table_name
        ORDER BY t.table_name
      `

      const tables = tablesResult.map(row => ({
        name: row.table_name,
        columns: row.columns ? String(row.columns).split(', ').filter(Boolean) : [],
        relations: {},
        indexes: []
      }))

      const enumsResult = await prisma.$queryRaw<Record<string, any>[]>`
        SELECT
          t.typname as enum_name,
          string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
        FROM pg_type t
        LEFT JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('Role')
        GROUP BY t.typname
        ORDER BY t.typname
      `

      const enums: Record<string, string[]> = {}
      for (const row of enumsResult) {
        if (row.enum_name && row.values) {
          enums[row.enum_name] = String(row.values).split(', ')
        }
      }

      const availableTables = tables.map(t => t.name).join(', ')

      const overview = tables
        .map((table) => {
          const relations = Object.entries(table.relations || {})
            .map(([relation, target]) => `${relation} -> ${target}`)
            .join(', ') || 'none'
          return `${table.name}: columns [${table.columns.join(', ')}]; relations [${relations}]`
        })
        .join('\n') + '\n\nEnums:\n' + Object.entries(enums).map(([name, values]) => `${name}: ${values.join(', ')}`).join('\n')

      return {
        overview,
        availableTables,
        tables: tables.map(t => t.name)
      }
    } catch (error) {
      console.error('Database schema introspection error:', error)
      return {
        overview: 'User: columns [id, email, name, role, createdAt, updatedAt]\nFolder: columns [id, name, createdAt, updatedAt, createdById]\nTest: columns [id, uid, title, description, duration, questions, isActive, createdAt, updatedAt, createdById, folderId]\nStudent: columns [id, name, code, createdAt, testId]\nAttempt: columns [id, answers, score, startedAt, submittedAt, duration, studentId, testId, tabSwitches, fullscreenExits]\n\nEnums:\nRole: TEACHER, ADMIN',
        availableTables: 'User, Folder, Test, Student, Attempt',
        tables: ['User', 'Folder', 'Test', 'Student', 'Attempt']
      }
    }
  }

  private async executeReadOnlySql(rawSql: string, testId: string): Promise<string> {
    const sql = rawSql.trim()

    try {
      const result = await prisma.$queryRawUnsafe<unknown[]>(sql)
      const payload = result.length > 0
        ? JSON.stringify(result, JSON_REPLACER, 2)
        : 'No rows returned.'

      console.dir({ sql, result: payload }, { depth: null })
      return payload
    } catch (error) {
      const message = (error as any)?.message || String(error)
      console.error('SQL execution error:', { sql, message })

      const corrected = this.autoQuoteIdentifiers(sql)
      if (corrected && corrected !== sql) {
        try {
          const retry = await prisma.$queryRawUnsafe<unknown[]>(corrected)
          const payload = retry.length > 0
            ? JSON.stringify(retry, JSON_REPLACER, 2)
            : 'No rows returned.'
          console.dir({ originalSql: sql, correctedSql: corrected, result: payload }, { depth: null })
          return payload
        } catch (e2) {
          const m2 = (e2 as any)?.message || String(e2)
          console.error('SQL retry execution error:', { originalSql: sql, correctedSql: corrected, message: m2 })
          return `SQL_ERROR: ${message}\nRETRY_SQL: ${corrected}\nRETRY_ERROR: ${m2}\nTIP: Quote all identifiers, e.g. SELECT "title" FROM "Test" WHERE "id" = '...'.`
        }
      }

      return `SQL_ERROR: ${message}\nTIP: Quote all identifiers, e.g. SELECT "title" FROM "Test" WHERE "id" = '...'.`
    }
  }

  private getToolResponse(result: any): string {
    if (!result?.toolResults || !Array.isArray(result.toolResults)) return ''

    for (const toolResult of result.toolResults) {
      if (toolResult?.output) {
        const output = String(toolResult.output).trim()
        if (output && !output.startsWith('SQL_ERROR')) {
          return output
        }
      }
    }

    for (const toolResult of result.toolResults) {
      if (toolResult?.output?.startsWith('SQL_ERROR')) {
        return 'I encountered an issue retrieving that data. Please try again.'
      }
    }

    return ''
  }

  private autoQuoteIdentifiers(sql: string): string | undefined {
    if (typeof sql !== 'string' || !sql.trim()) return undefined

    let corrected = sql

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const quoteWord = (text: string, word: string) => {
      const alreadyQuoted = new RegExp(String.raw`"${escapeRegex(word)}"`, 'g')
      if (alreadyQuoted.test(text)) return text

      const pattern = new RegExp(
        String.raw`(?<!["'])\b${escapeRegex(word)}\b(?!["'])`,
        'g'
      )
      return text.replace(pattern, `"${word}"`)
    }

    const commonTables = ['User', 'Folder', 'Test', 'Student', 'Attempt']
    const commonColumns = ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt', 'createdById', 'folderId', 'title', 'description', 'duration', 'questions', 'isActive', 'uid', 'code', 'testId', 'answers', 'score', 'startedAt', 'submittedAt', 'studentId', 'tabSwitches', 'fullscreenExits']

    for (const table of commonTables) {
      corrected = quoteWord(corrected, table)
    }

    for (const col of commonColumns) {
      corrected = quoteWord(corrected, col)
    }

    return corrected
  }
}
