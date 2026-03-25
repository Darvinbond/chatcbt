import { generateText, tool, generateObject } from 'ai'
import type { CoreMessage, LanguageModel } from 'ai'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import prisma from '@/lib/prisma'
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
  questions: z.array(AiTheoryQuestionRowSchema),
})

const MixedQuestionsResponseSchema = z.object({
  objectiveQuestions: z.array(ObjectiveQuestionRowSchema),
  theoryQuestions: z.array(AiTheoryQuestionRowSchema),
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
    try {
      const result = await generateObject({
        model: this.objectModel,
        schema: QuestionsResponseSchema,
        ...(this.objectConfig.providerOptions
          ? { providerOptions: this.objectConfig.providerOptions }
          : {}),
        prompt: `You are an exam question generator. A teacher is telling you what they need — read their request carefully and do exactly what they say.

TEACHER'S REQUEST:
${content}

MODE HINT: ${mode}

RULES:
- Generate exactly the number and types of objective questions the teacher asked for. If they said 30, generate 30. If they said 10, generate 10. If they didn't specify a count, generate 10.
- Follow ALL of the teacher's instructions about question types, formats, and styles precisely. If they request specific types (fill-in-the-blank/gap, antonyms, synonyms, sentence completion, comprehension, cloze tests, vocabulary, grammar, etc.), distribute questions across ALL requested types. Do NOT default everything to plain multiple-choice.
- If the teacher pasted existing questions, reformat them faithfully into the structured format.
- Use the "type" field: "multiple-choice" (4 options) for standard MCQ, antonym/synonym selection, vocabulary, etc.; "fill-blank" for fill-in-the-gap/blank questions; "true-false" for true/false.
- For fill-in-the-blank questions, write the sentence with a blank (e.g. "The cat sat on the ___") as the question text, and provide the correct word plus distractors as options.
- Every question MUST have exactly one option with "isCorrect": true.
- Cover different subtopics and angles — no duplicate questions.
- Do NOT simplify, reduce, or ignore any part of what the teacher asked for.

If the topic is inappropriate or empty, generate challenging multiple-choice questions on Nigerian history instead.`,
      })

      return {
        questions: result.object.questions.map((q) => ({
          ...q,
          points: Number.isFinite(q.points) ? q.points : 1,
          id: uuidv4(),
        })),
      }
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
    try {
      const result = await generateObject({
        model: this.objectModel,
        schema: MixedQuestionsResponseSchema,
        ...(this.objectConfig.providerOptions
          ? { providerOptions: this.objectConfig.providerOptions }
          : {}),
        prompt: `You are an exam question generator. A teacher is telling you what they need — read their request carefully and do exactly what they say. Generate BOTH objective (choice-based) AND theory (written/essay) questions as requested.

TEACHER'S REQUEST:
${content}

MODE HINT: ${mode}

RULES:
- Generate exactly the number and types of questions the teacher asked for. If they said 30 objective and 4 theory, generate exactly 30 objective and 4 theory. Follow their counts precisely.
- If the teacher didn't specify counts, default to 10 objective and 5 theory.
- Follow ALL of the teacher's instructions about question types, formats, and styles. If they request specific objective types (fill-in-the-blank/gap, antonyms, synonyms, comprehension, cloze, grammar, etc.), distribute the objective questions across ALL requested types. Do NOT default everything to plain multiple-choice.
- If the teacher requests comprehension passages, short stories, or reading texts for theory questions, include the FULL passage/story text in the first theory question (clearly labelled, e.g. "Read the passage below and answer the questions that follow:\\n\\n[passage text]\\n\\nQuestion: ..."). Subsequent theory questions referencing the same passage should note "Based on the passage above, ..." or similar.
- If the teacher pasted existing questions, reformat them faithfully into the structured format.
- For objective questions: use "type" field — "multiple-choice" (4 options), "fill-blank", or "true-false". Every objective question MUST have exactly one option with "isCorrect": true.
- For theory questions: include sensible "points" (5–15) and "markingGuide" (grading hints for teachers, or "" if none).
- Cover different subtopics and angles — no duplicate questions.
- Do NOT simplify, reduce, or ignore any part of what the teacher asked for.

If the topic is inappropriate or empty, generate questions on Nigerian history instead.`,
      })

      const objectiveRows: Array<ObjectiveQuestionWithId> =
        result.object.objectiveQuestions.map((q) => ({
          ...q,
          points: Number.isFinite(q.points) ? q.points : 1,
          id: uuidv4(),
        }))

      const theoryRows = result.object.theoryQuestions.map((q) => ({
        id: uuidv4(),
        question: q.question,
        type: 'theory' as const,
        points: Number.isFinite(q.points) ? q.points : 5,
        ...(q.markingGuide?.trim()
          ? { markingGuide: q.markingGuide.trim() }
          : {}),
      }))

      return { questions: [...objectiveRows, ...theoryRows] }
    } catch (error) {
      console.error('AI mixed generation error:', error)
      throw new Error('Failed to generate questions')
    }
  }

  async parseTheoryQuestions(
    content: string
  ): Promise<{
    questions: Array<{
      id: string
      question: string
      type: 'theory'
      points: number
      markingGuide?: string
    }>
  }> {
    try {
      const result = await generateObject({
        model: this.objectModel,
        schema: TheoryQuestionsResponseSchema,
        ...(this.objectConfig.providerOptions
          ? { providerOptions: this.objectConfig.providerOptions }
          : {}),
        prompt: `You are an exam question generator. A teacher is telling you what they need — read their request carefully and do exactly what they say. Generate ONLY theory (written/essay) questions. Students answer in long form in a rich text editor — no multiple choice.

TEACHER'S REQUEST:
${content}

RULES:
- Generate exactly the number of theory questions the teacher asked for. If they said 4, generate 4. If they said 10, generate 10. If they didn't specify a count, generate 5.
- Follow ALL of the teacher's structural and format requirements. If they request comprehension passages, short stories, reading texts, poems, or any specific format, you MUST include them exactly as described.
- When a comprehension passage or story is requested, include the FULL passage/story text in the first question (clearly labelled, e.g. "Read the passage below and answer the questions that follow:\\n\\n[passage text]\\n\\nQuestion: ..."). Subsequent questions referencing the same passage should note "Based on the passage above, ..." or similar.
- If the teacher pasted existing questions, reformat them faithfully into the structured format.
- Each question needs a sensible max point value in "points" (e.g. 5–15 depending on depth).
- Always include "markingGuide" — what an excellent answer should cover, or "" if none. Teachers use this for grading only.
- Questions should invite analysis, explanation, comparison, or evaluation.
- Do NOT simplify, reduce, or ignore any part of what the teacher asked for.

If the topic is inappropriate or empty, generate theory questions on Nigerian history instead.`,
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
