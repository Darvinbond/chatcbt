import { NextRequest } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
