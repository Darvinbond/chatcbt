import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId, studentCode } = z
      .object({
        testId: z.string(),
        studentCode: z.string(),
      })
      .parse(body);

    const student = await prisma.student.findFirst({
      where: {
        testId,
        code: studentCode,
      },
    });

    if (!student) {
      return ApiResponseBuilder.notFound("Student");
    }

    return ApiResponseBuilder.success(student);
  } catch (error) {
    return ApiResponseBuilder.error(
      "INTERNAL_SERVER_ERROR",
      "Failed to validate student",
      500
    );
  }
}
