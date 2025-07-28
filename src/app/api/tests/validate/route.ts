import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId } = z
      .object({
        testId: z.string(),
      })
      .parse(body);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
      },
    });

    if (!test) {
      return ApiResponseBuilder.notFound("Test");
    }

    return ApiResponseBuilder.success(test);
  } catch (error) {
    return ApiResponseBuilder.error(
      "INTERNAL_SERVER_ERROR",
      "Failed to validate test",
      500
    );
  }
}
