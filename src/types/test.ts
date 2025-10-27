import { z } from 'zod';

export const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
  tests: z.array(z.lazy(() => TestSchema)).optional(),
});

export type Folder = z.infer<typeof FolderSchema>;

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name must be less than 100 characters'),
});

export type CreateFolderDto = z.infer<typeof CreateFolderSchema>;

export type Option = z.infer<typeof OptionSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(OptionSchema),
  type: z.enum(['multiple-choice', 'true-false', 'fill-blank']),
  points: z.number().default(1),
});

export type Question = z.infer<typeof QuestionSchema>;

export const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email().optional(),
  code: z.string().optional(),
});

export type Student = z.infer<typeof StudentSchema>;

export type Attempt = {
  id: string;
  answers: Record<string, string>;
  score?: number;
  startedAt: Date;
  submittedAt: Date;
  duration?: number;
  student: Student;
  test: Test;
};

export const AttemptSchema: z.ZodType<Attempt> = z.lazy(() => z.object({
  id: z.string(),
  answers: z.record(z.string(), z.string()),
  score: z.number().optional(),
  startedAt: z.date(),
  submittedAt: z.date(),
  duration: z.number().optional(),
  student: StudentSchema,
  test: TestSchema,
}));

export type Test = {
  id: string;
  uid: string;
  title: string;
  description?: string;
  duration: number;
  questions: Question[];
  students?: Student[];
  attempts?: Attempt[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  folderId?: string;
};

export const TestSchema: z.ZodType<Test> = z.lazy(() => z.object({
  id: z.string(),
  uid: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  questions: z.array(QuestionSchema),
  students: z.array(StudentSchema).optional(),
  attempts: z.array(AttemptSchema).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
  folderId: z.string().optional(),
}));

export const CreateTestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  questions: z.array(QuestionSchema),
  students: z.array(StudentSchema).optional(),
  attempts: z.array(AttemptSchema).optional(),
  isActive: z.boolean(),
});

export type CreateTestDto = z.infer<typeof CreateTestSchema>;

export const UpdateTestSchema = CreateTestSchema.partial();

export type UpdateTestDto = z.infer<typeof UpdateTestSchema>;
