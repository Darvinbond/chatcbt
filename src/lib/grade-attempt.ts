import { createAiService } from '@/services/ai'
import { theoryAnswerToPlainText } from '@/lib/theory-answer'
import {
  QuestionSchema,
  isObjectiveQuestion,
  isTheoryQuestion,
  type Question,
} from '@/types/test'
import type { Prisma } from '@prisma/client'

export type AttemptGradingPayload = {
  score: number
  gradingMetadata: {
    objectiveEarned: number
    objectiveMax: number
    theory?: Record<string, { earned: number; max: number; comment: string }>
  }
}

export async function computeAttemptGrading(
  questions: Question[],
  answers: Record<string, string>
): Promise<AttemptGradingPayload> {
  let objectiveEarned = 0
  let objectiveMax = 0
  const theoryMarks: Record<
    string,
    { earned: number; max: number; comment: string }
  > = {}

  for (const question of questions) {
    if (isObjectiveQuestion(question)) {
      const max = question.points ?? 1
      objectiveMax += max
      const correctOption = question.options.find((o) => o.isCorrect)
      if (
        correctOption &&
        answers[question.id] &&
        answers[question.id] === correctOption.id
      ) {
        objectiveEarned += max
      }
    }
  }

  const theoryQuestions = questions.filter(isTheoryQuestion)
  const needsLlmGrading = theoryQuestions.length > 0

  if (needsLlmGrading) {
    const ai = createAiService()
    for (const q of theoryQuestions) {
      const raw = answers[q.id]
      const plain = theoryAnswerToPlainText(raw ?? '')
      const max = q.points ?? 5
      if (!plain) {
        theoryMarks[q.id] = {
          earned: 0,
          max,
          comment: 'No answer submitted for this question.',
        }
        continue
      }
      try {
        const { score, comment } = await ai.gradeTheoryAnswer({
          questionText: q.question,
          studentAnswer: plain,
          maxPoints: max,
          markingGuide: q.markingGuide,
        })
        theoryMarks[q.id] = { earned: score, max, comment }
      } catch {
        theoryMarks[q.id] = {
          earned: 0,
          max,
          comment:
            'Automatic marking failed for this question. Your instructor can review your answer.',
        }
      }
    }
  }

  const theoryEarned = Object.values(theoryMarks).reduce((s, m) => s + m.earned, 0)
  const score = objectiveEarned + theoryEarned

  const gradingMetadata: AttemptGradingPayload['gradingMetadata'] = {
    objectiveEarned,
    objectiveMax,
    ...(Object.keys(theoryMarks).length > 0 ? { theory: theoryMarks } : {}),
  }

  return { score, gradingMetadata }
}

export function parseTestQuestions(json: unknown): Question[] {
  return QuestionSchema.array().parse(json)
}

export function gradingMetadataToPrismaJson(
  meta: AttemptGradingPayload['gradingMetadata']
): Prisma.InputJsonValue {
  return meta as unknown as Prisma.InputJsonValue
}
