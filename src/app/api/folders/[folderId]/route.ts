import { NextRequest } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DeleteFolderBodySchema = z.object({
  /** When true, permanently delete all tests in this folder. When false (default), tests are kept with no folder. */
  deleteTests: z.boolean().optional().default(false),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params;

  try {
    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return ApiResponseBuilder.unauthorized()
    }

    try {
      const appUser = await prisma.$transaction(async (tx) => {
        return await tx.user.findUnique({
          where: { email: user.email! },
        });
      });

      if (!appUser) {
        console.error('User not found in database:', user.email)
        return ApiResponseBuilder.unauthorized()
      }

      const folder = await prisma.$transaction(async (tx) => {
        return await tx.folder.findFirst({
          where: {
            id: folderId,
            createdById: appUser.id,
          },
          include: {
            tests: {
              orderBy: { createdAt: 'desc' }
            }
          },
        });
      });

      if (!folder) {
        return ApiResponseBuilder.error('NOT_FOUND', 'Folder not found', 404)
      }

      return ApiResponseBuilder.success(folder)
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Reset the Prisma client on error
      await prisma.$disconnect()
      return ApiResponseBuilder.error('DATABASE_ERROR', 'Database operation failed', 500)
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/folders/[folderId]:', error)
      return ApiResponseBuilder.error('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiResponseBuilder.unauthorized()
    }

    const appUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!appUser) {
      return ApiResponseBuilder.unauthorized()
    }

    const ownsFolder = await prisma.folder.findFirst({
      where: { id: folderId, createdById: appUser.id },
      select: { id: true },
    })

    if (!ownsFolder) {
      return ApiResponseBuilder.error('NOT_FOUND', 'Folder not found', 404)
    }

    let body: unknown = {}
    try {
      const text = await request.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      body = {}
    }

    const parsed = DeleteFolderBodySchema.safeParse(body)
    if (!parsed.success) {
      return ApiResponseBuilder.error('VALIDATION_ERROR', 'Invalid request body', 400)
    }

    const { deleteTests } = parsed.data

    await prisma.$transaction(async (tx) => {
      if (deleteTests) {
        await tx.test.deleteMany({
          where: { folderId, createdById: appUser.id },
        })
      } else {
        await tx.test.updateMany({
          where: { folderId, createdById: appUser.id },
          data: { folderId: null },
        })
      }
      await tx.folder.delete({
        where: { id: folderId, createdById: appUser.id },
      })
    })

    return ApiResponseBuilder.success({ message: 'Folder deleted' })
  } catch (error) {
    console.error('DELETE /api/folders/[folderId]:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'Failed to delete folder', 500)
  }
}
