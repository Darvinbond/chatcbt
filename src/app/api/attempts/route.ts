import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";

const deleteAttemptsSchema = z.object({
  attemptIds: z.array(z.string()),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = deleteAttemptsSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { attemptIds } = validationResult.data;

    await prisma.attempt.deleteMany({
      where: {
        id: {
          in: attemptIds,
        },
      },
    });

    return ApiResponseBuilder.success(null, "Attempts deleted successfully");
  } catch (error) {
    console.error("Delete attempts error:", error);
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to delete attempts",
      500
    );
  }
}
