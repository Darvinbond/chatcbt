import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { QuestionSchema } from "@/types/test";

const attemptTestSchema = z.object({
  studentId: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const body = await request.json();
    const validationResult = attemptTestSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { studentId } = validationResult.data;

    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        testId,
        studentId,
      },
    });

    if (existingAttempt) {
      return ApiResponseBuilder.error("ALREADY_ATTEMPTED", "You have already attempted this test", 400);
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    const questions = QuestionSchema.array().parse(test.questions);

    const questionsWithoutAnswers = questions.map((q) => {
      const { options, ...rest } = q;
      return {
        ...rest,
        options: options.map(({ isCorrect, ...o }) => o),
      };
    });

    await prisma.attempt.create({
      data: {
        testId,
        studentId,
        answers: {},
      },
    });

    return ApiResponseBuilder.success({ questions: questionsWithoutAnswers });
  } catch (error) {
    console.error("Attempt test error:", error);
    if (error instanceof z.ZodError) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", error.message, 400);
    }
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to attempt test",
      500
    );
  }
}
