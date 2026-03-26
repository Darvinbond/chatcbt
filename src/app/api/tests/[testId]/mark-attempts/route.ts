import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  computeAttemptGrading,
  gradingMetadataToPrismaJson,
  parseTestQuestions,
} from "@/lib/grade-attempt";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponseBuilder.unauthorized();
    }

    const appUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!appUser) {
      return ApiResponseBuilder.unauthorized();
    }

    const { testId } = await params;

    const test = await prisma.test.findFirst({
      where: { id: testId, createdById: appUser.id },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    const questions = parseTestQuestions(test.questions);

    const attempts = await prisma.attempt.findMany({
      where: {
        testId,
        submittedAt: { not: null },
        score: null,
      },
    });

    let marked = 0;
    const errors: string[] = [];

    for (const att of attempts) {
      const rawAnswers = att.answers;
      if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
        errors.push(att.id);
        continue;
      }
      const answers = rawAnswers as Record<string, string>;
      try {
        const { score, gradingMetadata } = await computeAttemptGrading(questions, answers);
        await prisma.attempt.update({
          where: { id: att.id },
          data: {
            score,
            gradingMetadata: gradingMetadataToPrismaJson(gradingMetadata),
          },
        });
        marked += 1;
      } catch (e) {
        console.error("Mark attempt error", att.id, e);
        errors.push(att.id);
      }
    }

    return ApiResponseBuilder.success({
      marked,
      errorAttemptIds: errors,
    });
  } catch (error) {
    console.error("Mark attempts error:", error);
    return ApiResponseBuilder.error("INTERNAL_ERROR", "Failed to mark attempts", 500);
  }
}
