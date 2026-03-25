import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import { z } from "zod";
import { createAiService } from "@/services/ai";

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
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { query, history } = validationResult.data;

    const ai = createAiService();
    const result = await ai.getTestInsights(query, history, testId);

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
