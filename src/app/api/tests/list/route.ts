import { NextRequest } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
      
      const tests = await prisma.$transaction(async (tx) => {
        return await tx.test.findMany({
          where: { createdById: appUser.id },
          orderBy: { createdAt: 'desc' },
        });
      });
      
      return ApiResponseBuilder.success(tests)
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Reset the Prisma client on error
      await prisma.$disconnect()
      return ApiResponseBuilder.error('DATABASE_ERROR', 'Database operation failed', 500)
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/tests/list:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}
