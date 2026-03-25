import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { QuestionSchema, isObjectiveQuestion, isTheoryQuestion } from "@/types/test";
import { Prisma, Attempt } from "@prisma/client";
import { createAiService } from "@/services/ai";
import { theoryAnswerToPlainText } from "@/lib/theory-answer";

const submitTestSchema = z.object({
  studentId: z.string(),
  answers: z.record(z.string(), z.string()),
  submittedAt: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const body = await request.json();

    const validationResult = submitTestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Zod validation error:", validationResult.error.format());
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { studentId, answers, submittedAt } = validationResult.data;

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    const questions = QuestionSchema.array().parse(test.questions);

    let objectiveEarned = 0;
    let objectiveMax = 0;
    const theoryMarks: Record<string, { earned: number; max: number; comment: string }> = {};

    for (const question of questions) {
      if (isObjectiveQuestion(question)) {
        const max = question.points ?? 1;
        objectiveMax += max;
        const correctOption = question.options.find((o) => o.isCorrect);
        if (
          correctOption &&
          answers[question.id] &&
          answers[question.id] === correctOption.id
        ) {
          objectiveEarned += max;
        }
      }
    }

    const theoryQuestions = questions.filter(isTheoryQuestion);
    const needsLlmGrading = theoryQuestions.length > 0;

    if (needsLlmGrading) {
      const ai = createAiService();
      for (const q of theoryQuestions) {
        const raw = answers[q.id];
        const plain = theoryAnswerToPlainText(raw ?? "");
        const max = q.points ?? 5;
        if (!plain) {
          theoryMarks[q.id] = {
            earned: 0,
            max,
            comment: "No answer submitted for this question.",
          };
          continue;
        }
        try {
          const { score, comment } = await ai.gradeTheoryAnswer({
            questionText: q.question,
            studentAnswer: plain,
            maxPoints: max,
            markingGuide: q.markingGuide,
          });
          theoryMarks[q.id] = { earned: score, max, comment };
        } catch {
          theoryMarks[q.id] = {
            earned: 0,
            max,
            comment: "Automatic marking failed for this question. Your instructor can review your answer.",
          };
        }
      }
    }

    const theoryEarned = Object.values(theoryMarks).reduce((s, m) => s + m.earned, 0);
    const theoryMax = theoryQuestions.reduce((s, q) => s + (q.points ?? 5), 0);

    const score = objectiveEarned + theoryEarned;

    const gradingMetadata = {
      objectiveEarned,
      objectiveMax,
      ...(Object.keys(theoryMarks).length > 0 ? { theory: theoryMarks } : {}),
    };

    const attempt = await prisma.attempt.findFirst({
      where: {
        testId,
        studentId,
      },
    });

    if (!attempt) {
      return ApiResponseBuilder.notFound("Attempt");
    }

    if (attempt.submittedAt) {
      return ApiResponseBuilder.error("ALREADY_SUBMITTED", "You have already submitted this test", 400);
    }

    const duration = Math.floor(
      (new Date(submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000
    );

    const updatedAttempt = await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        answers: answers as unknown as Prisma.InputJsonValue,
        score,
        duration,
        submittedAt,
        gradingMetadata: gradingMetadata as unknown as Prisma.InputJsonValue,
      },
    });

    return ApiResponseBuilder.success<Attempt>(updatedAttempt);
  } catch (error) {
    console.error("Submit test error:", error);
    if (error instanceof z.ZodError) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", error.message, 400);
    }
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to submit test",
      500
    );
  }
}
