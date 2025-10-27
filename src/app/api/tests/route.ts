import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '../../../lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { customAlphabet } from 'nanoid'
import { CodeGenerator } from '@/lib/security/code-generator'
import { v4 as uuidv4 } from 'uuid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)

const CreateTestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.number().min(1).max(480),
  questions: z.array(z.any()),
  students: z.array(z.string()).optional(),
  folderId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return ApiResponseBuilder.unauthorized()
    }
    
    // Ensure a user record exists in our public User table
    const appUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        email: user.email!,
        name: user.user_metadata?.name || user.email!,
      },
    });
    
    // Validate request body
    const body = await request.json()
    console.log('📝 CreateTest API - Received body:', JSON.stringify(body, null, 2))
    console.log('📝 CreateTest API - folderId from body:', body.folderId)
    const validated = CreateTestSchema.parse(body)
    console.log('📝 CreateTest API - validated folderId:', validated.folderId)
    
    // Use a transaction to create the test and students
    const test = await prisma.$transaction(async (tx) => {
      const questionsWithIds = validated.questions.map((q: any) => ({
        ...q,
        id: uuidv4(),
        options: q.options.map((o: any) => ({
          ...o,
          id: uuidv4(),
        })),
      }));

      const newTest = await tx.test.create({
        data: {
          title: validated.title,
          description: validated.description,
          duration: validated.duration,
          questions: questionsWithIds,
          uid: nanoid(),
          createdById: appUser.id,
          ...(validated.folderId && { folderId: validated.folderId }),
        },
      });

      if (validated.students && validated.students.length > 0) {
        const studentCodes = CodeGenerator.generateBatch(validated.students.length);
        const studentData = validated.students.map((name, index) => ({
          name,
          code: studentCodes[index],
          testId: newTest.id,
        }));
        await tx.student.createMany({
          data: studentData,
        });
      }

      return newTest;
    });
    
    return ApiResponseBuilder.success(test)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseBuilder.error('VALIDATION_ERROR', 'Invalid input', 400)
    }
    
    console.error('Create test error:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'Failed to create test', 500)
  }
}
