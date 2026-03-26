import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma, Attempt } from "@prisma/client";
import {
  computeAttemptGrading,
  gradingMetadataToPrismaJson,
  parseTestQuestions,
} from "@/lib/grade-attempt";

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

    const autoMark = test.autoMarkOnSubmit;

    if (!autoMark) {
      const updatedAttempt = await prisma.attempt.update({
        where: { id: attempt.id },
        data: {
          answers: answers as unknown as Prisma.InputJsonValue,
          score: null,
          gradingMetadata: Prisma.JsonNull,
          duration,
          submittedAt,
        },
      });

      return ApiResponseBuilder.success<Attempt>(updatedAttempt);
    }

    const questions = parseTestQuestions(test.questions);
    const { score, gradingMetadata } = await computeAttemptGrading(questions, answers);

    const updatedAttempt = await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        answers: answers as unknown as Prisma.InputJsonValue,
        score,
        duration,
        submittedAt,
        gradingMetadata: gradingMetadataToPrismaJson(gradingMetadata),
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
