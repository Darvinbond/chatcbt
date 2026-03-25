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

export const ObjectiveQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(OptionSchema),
  type: z.enum(['multiple-choice', 'true-false', 'fill-blank']),
  points: z.number().default(1),
});

export type ObjectiveQuestion = z.infer<typeof ObjectiveQuestionSchema>;

export const TheoryQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.literal('theory'),
  /** Maximum points an instructor assigns; LLM awards up to this. */
  points: z.number().default(5),
  /** Optional rubric shown only to teachers / the grader, not students. */
  markingGuide: z.string().optional(),
});

export type TheoryQuestion = z.infer<typeof TheoryQuestionSchema>;

export const QuestionSchema = z.discriminatedUnion('type', [
  TheoryQuestionSchema,
  ObjectiveQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

export function isTheoryQuestion(q: Question): q is TheoryQuestion {
  return q.type === 'theory';
}

export function isObjectiveQuestion(q: Question): q is ObjectiveQuestion {
  return q.type !== 'theory';
}

export function isStudentTheoryQuestion(q: StudentQuestion): q is StudentTheoryQuestion {
  return q.type === 'theory';
}

export function isStudentObjectiveQuestion(
  q: StudentQuestion
): q is StudentObjectiveQuestion {
  return q.type !== 'theory';
}

/** Student-facing theory prompt (no marking guide). */
export type StudentTheoryQuestion = Pick<TheoryQuestion, 'id' | 'question' | 'type' | 'points'>;

export type StudentObjectiveQuestion = {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  points: number;
  options: Array<{ id: string; text: string }>;
};

export type StudentQuestion = StudentObjectiveQuestion | StudentTheoryQuestion;

export const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email().optional(),
  code: z.string().optional(),
});

export type Student = z.infer<typeof StudentSchema>;

export const TheoryQuestionMarkSchema = z.object({
  earned: z.number(),
  max: z.number(),
  comment: z.string(),
});

export type TheoryQuestionMark = z.infer<typeof TheoryQuestionMarkSchema>;

export const AttemptGradingMetadataSchema = z.object({
  objectiveEarned: z.number(),
  objectiveMax: z.number(),
  theory: z.record(z.string(), TheoryQuestionMarkSchema).optional(),
});

export type AttemptGradingMetadata = z.infer<typeof AttemptGradingMetadataSchema>;

export type Attempt = {
  id: string;
  answers: Record<string, string>;
  score?: number;
  gradingMetadata?: AttemptGradingMetadata;
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
  gradingMetadata: AttemptGradingMetadataSchema.optional(),
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
