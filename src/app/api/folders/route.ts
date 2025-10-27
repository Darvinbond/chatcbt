import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponseBuilder } from "@/lib/api/response";
import { CreateFolderSchema } from "@/types/test";
import prisma from "@/lib/prisma";

// GET /api/folders - List folders for the authenticated user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponseBuilder.unauthorized();
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

    const folders = await prisma.folder.findMany({
      where: {
        createdById: appUser.id,
      },
      include: {
        tests: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ApiResponseBuilder.success(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return ApiResponseBuilder.error("INTERNAL_ERROR", "Failed to fetch folders", 500);
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponseBuilder.unauthorized();
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

    const body = await request.json();

    // Validate request body
    const validationResult = CreateFolderSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponseBuilder.error("VALIDATION_ERROR", "Invalid folder name", 400);
    }

    const { name } = validationResult.data;

    // Create the folder
    const folder = await prisma.folder.create({
      data: {
        name,
        createdById: appUser.id,
      },
    });

    return ApiResponseBuilder.success(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    return ApiResponseBuilder.error("INTERNAL_ERROR", "Failed to create folder", 500);
  }
}
