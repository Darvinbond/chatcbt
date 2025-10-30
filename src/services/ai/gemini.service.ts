import { generateText, tool, generateObject } from 'ai'
import type { CoreMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import prisma from '@/lib/prisma'

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

const JSON_REPLACER = (_: string, value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  return value
}

type ChatHistoryEntry = {
  sender: string
  content: string
}

export class GeminiService {
  private async introspectDatabaseTableSchemaUsingSystemTables(): Promise<{ overview: string; availableTables: string; tables: string[] }> {
    try {
      // Query table information from PostgreSQL system tables
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

      // Get enum information
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
      // Fallback to basic info
      return {
        overview: 'User: columns [id, email, name, role, createdAt, updatedAt]\nFolder: columns [id, name, createdAt, updatedAt, createdById]\nTest: columns [id, uid, title, description, duration, questions, isActive, createdAt, updatedAt, createdById, folderId]\nStudent: columns [id, name, code, createdAt, testId]\nAttempt: columns [id, answers, score, startedAt, submittedAt, duration, studentId, testId, tabSwitches, fullscreenExits]\n\nEnums:\nRole: TEACHER, ADMIN',
        availableTables: 'User, Folder, Test, Student, Attempt',
        tables: ['User', 'Folder', 'Test', 'Student', 'Attempt']
      }
    }
  }

  async parseContent(content: string, mode: 'text' | 'spreadsheet'): Promise<any> {
    try {
      const result = await generateObject({
        model: google('models/gemini-2.0-flash-exp'),
        schema: QuestionsResponseSchema,
        providerOptions: {
          google: {
            structuredOutputs: true,
          },
        },
        prompt: `Create structured test questions based on the provided content. If the content contains educational material, questions, or study topics, extract and format them properly. If the content is a direct request like "generate questions on...", create new questions about that topic. If the content doesn't make sense, is not related to education/testing, or is inappropriate, automatically generate 10 challenging multiple-choice questions about Nigerian history instead.

CRITICAL REQUIREMENT: Every question MUST have exactly one correct option marked as "isCorrect": true. No question can be left without a correct answer. This is MANDATORY - triple-check that every single question has exactly one correct option.

CONTENT TO PROCESS:
${content}

FINAL CHECK: Before returning, verify that each question has exactly one "isCorrect": true option - this rule cannot be broken.`
      })

      return result.object
    } catch (error) {
      console.error('AI parsing error:', error)
      throw new Error('Failed to parse content')
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
          model: google('models/gemini-2.0-flash-exp'),
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

        // accumulate conversation for another pass if the model made tool calls
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

      // Attempt one auto-correction pass by quoting known identifiers
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
      // Already quoted -> skip
      const alreadyQuoted = new RegExp(String.raw`"${escapeRegex(word)}"`, 'g')
      if (alreadyQuoted.test(text)) return text

      // Replace bare word boundaries not inside quotes with quoted version
      const pattern = new RegExp(
        String.raw`(?<!["'])\b${escapeRegex(word)}\b(?!["'])`,
        'g'
      )
      return text.replace(pattern, `"${word}"`)
    }

    // Common identifiers to quote
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
