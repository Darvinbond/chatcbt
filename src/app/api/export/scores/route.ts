import { NextRequest } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api/response'
import prisma from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Fetch all tests created by the user, including attempts and student info
    const tests = await prisma.test.findMany({
      where: { createdById: appUser.id },
      select: {
        id: true,
        title: true,
        attempts: {
          select: {
            id: true,
            score: true,
            submittedAt: true,
            duration: true,
            tabSwitches: true,
            fullscreenExits: true,
            student: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return ApiResponseBuilder.success(tests)

  } catch (error) {
    console.error('Error fetching scores:', error)
    return ApiResponseBuilder.error('INTERNAL_ERROR', 'Failed to fetch scores', 500)
  }
}
