"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Test, Student, Question } from "@/types/test";

interface TestContextType {
  test: Test | null;
  student: Student | null;
  questions: Question[];
  answers: Record<string, string>;
  setTest: (test: Test | null) => void;
  setStudent: (student: Student | null) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  clearTest: () => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [test, setTest] = useState<Test | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const clearTest = () => {
    setTest(null);
    setStudent(null);
    setQuestions([]);
    setAnswers({});
  };

  return (
    <TestContext.Provider
      value={{
        test,
        student,
        questions,
        answers,
        setTest,
        setStudent,
        setQuestions,
        setAnswer,
        clearTest,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}

export function useTestContext() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTestContext must be used within a TestProvider");
  }
  return context;
}
