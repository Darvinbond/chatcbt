"use client";

import { useTestContext } from "@/components/providers/test-provider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { testService } from "@/services/test.service";
import { Question } from "@/types/test";
import { cn } from "@/lib/utils";
import { SubmitConfirmationModal } from "./submit-confirmation-modal";

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
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullScreenRequested, setIsFullScreenRequested] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      if (test && student && student.id) {
        testService.submitTest(test.id, student.id, answers);
        clearTest();
      }
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, test, student, answers, clearTest]);

  // Enter full-screen mode when test starts
  useEffect(() => {
    if (!isFullScreenRequested) {
      const enterFullScreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).mozRequestFullScreen) {
            await (document.documentElement as any).mozRequestFullScreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        } catch (error) {
          // Full-screen not supported or user denied
          console.log('Full-screen mode not available');
        }
      };

      enterFullScreen();
      setIsFullScreenRequested(true);
    }
  }, [isFullScreenRequested]);

  // Exit full-screen mode when component unmounts (test completed)
  useEffect(() => {
    return () => {
      const exitFullScreen = async () => {
        try {
          if (document.fullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
              await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
              await (document as any).msExitFullscreen();
            }
          }
        } catch (error) {
          console.log('Could not exit full-screen mode');
        }
      };

      exitFullScreen();
    };
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
              variant="secondary"
              className="rounded-full"
            >
              Previous
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => setIsSubmitModalOpen(true)}
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
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={async () => {
          if (test && student && student.id) {
            setIsSubmitting(true);
            try {
              await testService.submitTest(test.id, student.id, answers);
              clearTest();
            } catch (error) {
              // Error is handled by the service
            } finally {
              setIsSubmitting(false);
            }
          }
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
