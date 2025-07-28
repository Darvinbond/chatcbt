import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { GeminiService } from "@/services/ai/gemini.service";

const chatRequestSchema = z.object({
  query: z.string(),
  history: z.array(
    z.object({
      sender: z.string(),
      content: z.string(),
    })
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { query, history } = validationResult.data;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        students: true,
        attempts: true,
      },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    const geminiService = new GeminiService();
    const result = await geminiService.getTestInsights(test, query, history);

    return ApiResponseBuilder.success(result);
  } catch (error) {
    console.error("Chat error:", error);
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to get chat response",
      500
    );
  }
}
