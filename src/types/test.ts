import { z } from 'zod';

export const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

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

export const TestSchema = z.object({
  id: z.string(),
  uid: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  questions: z.array(QuestionSchema),
  students: z.array(StudentSchema).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
});

export type Test = z.infer<typeof TestSchema>;

export const CreateTestSchema = TestSchema.omit({
  id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
});

export type CreateTestDto = z.infer<typeof CreateTestSchema>;

export const UpdateTestSchema = CreateTestSchema.partial();

export type UpdateTestDto = z.infer<typeof UpdateTestSchema>;
