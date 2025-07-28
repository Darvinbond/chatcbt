import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().optional(),
  question: z.string(),
  options: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string(),
      isCorrect: z.boolean(),
    })
  ),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  points: z.number(),
});

const newQuestionSchema = z.object({
  question: z.string(),
  options: z.array(
    z.object({
      text: z.string(),
      isCorrect: z.boolean(),
    })
  ),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  points: z.number(),
});

const saveQuestionsRequestSchema = z.object({
  testId: z.string(),
  questions: z.array(newQuestionSchema).optional(),
  updatedQuestions: z.array(questionSchema).optional(),
  deletedQuestionIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = saveQuestionsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { testId, questions, updatedQuestions, deletedQuestionIds } = validationResult.data;

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    let currentQuestions = (test.questions as any[]) || [];

    if (deletedQuestionIds && deletedQuestionIds.length > 0) {
      currentQuestions = currentQuestions.filter(
        (q) => !deletedQuestionIds.includes(q.id)
      );
    }

    if (updatedQuestions && updatedQuestions.length > 0) {
      for (const updatedQuestion of updatedQuestions) {
        const index = currentQuestions.findIndex((q) => q.id === updatedQuestion.id);
        if (index !== -1) {
          currentQuestions[index] = updatedQuestion;
        }
      }
    }

    if (questions && questions.length > 0) {
      currentQuestions.push(...questions);
    }

    await prisma.test.update({
      where: { id: testId },
      data: {
        questions: currentQuestions as any,
      },
    });

    return ApiResponseBuilder.success(null, "Questions saved successfully");
  } catch (error) {
    console.error("Questions error:", error);
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to save questions",
      500
    );
  }
}
