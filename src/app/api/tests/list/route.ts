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

    // Get search query
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim().toLowerCase()

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

      if (query) {
        // Handle search query - get all folders and tests, then filter server-side
        const [allFolders, allTests] = await Promise.all([
          prisma.folder.findMany({
            where: { createdById: appUser.id },
            include: {
              tests: {
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.test.findMany({
            where: { createdById: appUser.id },
            orderBy: { createdAt: 'desc' },
          })
        ]);

        // Filter folders by name
        const matchedFolders = allFolders.filter(folder =>
          folder.name.toLowerCase().includes(query)
        );

        // Filter tests by title
        const matchedTests = allTests.filter(test =>
          test.title.toLowerCase().includes(query)
        );

        // Group tests by folder for matched tests
        const folderTests = matchedTests.filter(test => test.folderId);
        const standaloneTests = matchedTests.filter(test => !test.folderId);

        // Create folder map for matched tests in folders
        const folderMap = new Map();
        matchedFolders.forEach(folder => {
          // Add folder matches and their tests that match the query
          const testsInFolder = folderTests.filter(test => test.folderId === folder.id);
          folderMap.set(folder.id, {
            ...folder,
            tests: testsInFolder
          });
        });

        // Add folders that have matching tests but weren't matched by folder name
        folderTests.forEach(test => {
          if (test.folderId && !folderMap.has(test.folderId)) {
            const folder = allFolders.find(f => f.id === test.folderId);
            if (folder) {
              folderMap.set(folder.id, {
                ...folder,
                tests: [test]
              });
            }
          }
        });

        const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const tests = standaloneTests;

        // Structure the response
        const data = {
          folders: folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            tests: folder.tests
          })),
          tests: tests.map(test => ({
            ...test,
            type: 'test' as const
          }))
        };

        return ApiResponseBuilder.success(data)
      } else {
        // No query - return all data as before
        const folders = await prisma.$transaction(async (tx) => {
          return await tx.folder.findMany({
            where: { createdById: appUser.id },
            include: {
              tests: {
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { createdAt: 'desc' },
          });
        });

        const testsWithoutFolder = await prisma.$transaction(async (tx) => {
          return await tx.test.findMany({
            where: {
              createdById: appUser.id,
              folderId: null
            },
            orderBy: { createdAt: 'desc' },
          });
        });

        const data = {
          folders: folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            tests: folder.tests
          })),
          tests: testsWithoutFolder.map(test => ({
            ...test,
            type: 'test' as const
          }))
        };

        return ApiResponseBuilder.success(data)
      }
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
