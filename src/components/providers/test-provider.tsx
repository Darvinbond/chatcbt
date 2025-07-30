"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Test, Student, Question } from "@/types/test";
import { CongratulationsModal } from "@/components/features/attempt/congratulations-modal";

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
  const [isCongratulationsModalOpen, setIsCongratulationsModalOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("ref") === "completed") {
      setIsCongratulationsModalOpen(true);
    }
  }, []);

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const clearTest = () => {
    setTest(null);
    setStudent(null);
    setQuestions([]);
    setAnswers({});
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("ref", "completed");
    window.location.search = urlParams.toString();
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
      <CongratulationsModal
        isOpen={isCongratulationsModalOpen}
        onClose={() => setIsCongratulationsModalOpen(false)}
      />
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
