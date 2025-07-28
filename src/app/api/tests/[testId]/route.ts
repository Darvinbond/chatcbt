import { NextRequest } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  console.log('NODE_ENV:', process.env.NODE_ENV)
  try {
    // Test connection first
    console.log('Testing Prisma connection...')
    await prisma.$connect()
    console.log('Prisma connected successfully')
    
    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return ApiResponseBuilder.unauthorized()
    }
    
    const appUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!appUser) {
      return ApiResponseBuilder.unauthorized()
    }
    
    const { testId } = await params;
    
    const test = await prisma.test.findUnique({
      where: { id: testId, createdById: appUser.id },
      include: {
        students: true,
      },
    })
    
    if (!test) {
      return ApiResponseBuilder.notFound('Test')
    }
    
    return ApiResponseBuilder.success(test)
  } catch (error) {
    console.error('Get test error:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'Failed to get test', 500)
  }
}
