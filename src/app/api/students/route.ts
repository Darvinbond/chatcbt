import { ApiResponseBuilder } from "@/lib/api/response";
import prisma from "@/lib/prisma";
import { StudentSchema } from "@/types/test";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId, students, deletedStudentIds } = z
      .object({
        testId: z.string(),
        students: z.array(StudentSchema),
        deletedStudentIds: z.array(z.string()).optional(),
      })
      .parse(body);

    const newStudents = students.filter((student) => !student.id);
    const updatedStudents = students.filter((student) => student.id);

    if (deletedStudentIds && deletedStudentIds.length > 0) {
      await prisma.student.deleteMany({
        where: {
          id: {
            in: deletedStudentIds,
          },
        },
      });
    }

    const createdStudents = await prisma.$transaction(
      newStudents.map((student) =>
        prisma.student.create({
          data: {
            name: student.name,
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            testId: testId,
          },
        })
      )
    );

    const updatedStudentsResult = await prisma.$transaction(
      updatedStudents.map((student) =>
        prisma.student.update({
          where: { id: student.id },
          data: { name: student.name },
        })
      )
    );

    return ApiResponseBuilder.success({
      createdStudents,
      updatedStudents: updatedStudentsResult,
    });
  } catch (error) {
    return ApiResponseBuilder.error(
      "INTERNAL_SERVER_ERROR",
      "Failed to save students",
      500
    );
  }
}
