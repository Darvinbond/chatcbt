import { NextRequest } from "next/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;

    await prisma.attempt.delete({
      where: { id: attemptId },
    });

    return ApiResponseBuilder.success(null, "Attempt deleted successfully");
  } catch (error) {
    console.error("Delete attempt error:", error);
    return ApiResponseBuilder.error(
      "INTERNAL_ERROR",
      "Failed to delete attempt",
      500
    );
  }
}
