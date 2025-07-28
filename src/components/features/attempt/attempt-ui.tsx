"use client";

"use client";

import { useTestContext } from "@/components/providers/test-provider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { testService } from "@/services/test.service";
import { Question } from "@/types/test";
import { cn } from "@/lib/utils";

export function AttemptUI() {
  const {
    test,
    student,
    questions,
    setQuestions,
    answers,
    setAnswer,
    clearTest,
  } = useTestContext();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test?.duration! * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev) => prev - 1);
  };

  if (!test || !student || !questions) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-[100dvh] max-w-6xl mx-auto">
      <header className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-bold">{test.title}</h1>
          <p className="text-sm text-gray-500">{student.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            {currentQuestionIndex + 1} / {questions.length}
          </p>
          <p className="text-red-600 text-base font-semibold">
            {Math.floor(timeLeft / 60)}:
            {("0" + (timeLeft % 60)).slice(-2)}
          </p>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1}
            </h2>
            <p className="text-sm">{currentQuestion?.question}</p>
          </div>
          <div className="mt-8 space-y-2">
            {currentQuestion?.options.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg cursor-pointer ${
                  answers[currentQuestion.id] === option.id
                    ? "bg-zinc-300"
                    : "bg-zinc-50"
                }`}
                onClick={() => setAnswer(currentQuestion.id, option.id)}
              >
                <label className="flex items-center gap-4 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`option-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => setAnswer(currentQuestion.id, option.id)}
                    className="accent-zinc-800 w-5 h-5"
                  />
                  {option.text}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <Button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="rounded-full"
            >
              Previous
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={async () => {
                  if (test && student && student.id) {
                    await testService.submitTest(test.id, student.id, answers);
                    clearTest();
                  }
                }}
                className="rounded-full"
              >
                Finish
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="rounded-full"
              >
                Next
              </Button>
            )}
          </div>
        </main>
        <aside className="hidden md:block w-4/12 p-4 overflow-y-auto bg-zinc-50">
          <h3 className="text-lg font-semibold mb-4">Questions</h3>
          <div className="grid grid-cols-6 gap-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-md cursor-pointer text-xs",
                  {
                    "ring-2 ring-offset-2 ring-zinc-800":
                      currentQuestionIndex === index,
                    "bg-zinc-800 text-white": answers[question.id],
                    "bg-zinc-300": !answers[question.id],
                  }
                )}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
