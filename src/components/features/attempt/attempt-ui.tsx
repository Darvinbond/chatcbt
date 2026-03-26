"use client";

import { useTestContext } from "@/components/providers/test-provider";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { testService } from "@/services/test.service";
import {
  isStudentObjectiveQuestion,
  isStudentTheoryQuestion,
} from "@/types/test";
import { cn } from "@/lib/utils";
import { SubmitConfirmationModal } from "./submit-confirmation-modal";
import { TheoryAnswerEditor } from "./theory-answer-editor";
import { theoryAnswerToPlainText } from "@/lib/theory-answer";
import { toast } from "sonner";
import { BookOpen, ListChecks } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AttemptUI() {
  const {
    test,
    student,
    questions,
    answers,
    setAnswer,
    clearTest,
  } = useTestContext();
  const [objectiveIndex, setObjectiveIndex] = useState(0);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [section, setSection] = useState<"objective" | "theory">("objective");
  const [timeLeft, setTimeLeft] = useState(test?.duration! * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullScreenRequested, setIsFullScreenRequested] = useState(false);

  const objectiveQuestions = useMemo(
    () => questions.filter(isStudentObjectiveQuestion),
    [questions]
  );
  const theoryQuestions = useMemo(
    () => questions.filter(isStudentTheoryQuestion),
    [questions]
  );
  const hasObjective = objectiveQuestions.length > 0;
  const hasTheory = theoryQuestions.length > 0;

  useEffect(() => {
    if (!hasObjective && hasTheory) {
      setSection("theory");
    }
    if (hasObjective && !hasTheory) {
      setSection("objective");
    }
  }, [hasObjective, hasTheory]);

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
        } catch {
          console.log("Full-screen mode not available");
        }
      };

      enterFullScreen();
      setIsFullScreenRequested(true);
    }
  }, [isFullScreenRequested]);

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
        } catch {
          console.log("Could not exit full-screen mode");
        }
      };

      exitFullScreen();
    };
  }, []);

  if (!test || !student || !questions) {
    return null;
  }

  const activeList =
    section === "objective" ? objectiveQuestions : theoryQuestions;
  const activeIndex =
    section === "objective" ? objectiveIndex : theoryIndex;
  const setActiveIndex =
    section === "objective" ? setObjectiveIndex : setTheoryIndex;

  const currentQuestion = activeList[activeIndex];

  const openSubmitModal = () => setIsSubmitModalOpen(true);

  const handleNext = () => {
    if (activeIndex < activeList.length - 1) {
      setActiveIndex((i) => i + 1);
      return;
    }
    if (section === "objective" && hasTheory) {
      setSection("theory");
      setTheoryIndex(0);
      toast.message("Written responses", {
        description: "Now answer the long-form questions.",
      });
      return;
    }
    openSubmitModal();
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
      return;
    }
    if (section === "theory" && hasObjective) {
      setSection("objective");
      setObjectiveIndex(Math.max(0, objectiveQuestions.length - 1));
    }
  };

  const showSectionTabs = hasObjective && hasTheory;

  return (
    <div className="flex flex-col h-[100dvh] max-w-6xl mx-auto bg-white">
      <header className="flex flex-col gap-3 p-4 border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-800">
              {test.title}
            </h1>
            <p className="text-sm text-zinc-500">{student.name}</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <p className="text-sm tabular-nums text-zinc-600">
              {section === "objective" ? (
                <>
                  Multiple choice{" "}
                  <span className="font-medium text-zinc-800">
                    {objectiveQuestions.length ? objectiveIndex + 1 : 0} /{" "}
                    {objectiveQuestions.length}
                  </span>
                </>
              ) : (
                <>
                  Written{" "}
                  <span className="font-medium text-zinc-800">
                    {theoryQuestions.length ? theoryIndex + 1 : 0} /{" "}
                    {theoryQuestions.length}
                  </span>
                </>
              )}
            </p>
            <p className="text-red-600 text-base font-semibold tabular-nums">
              {Math.floor(timeLeft / 60)}:
              {("0" + (timeLeft % 60)).slice(-2)}
            </p>
          </div>
        </div>

        {showSectionTabs ? (
          <Tabs
            value={section}
            onValueChange={(v) => setSection(v as "objective" | "theory")}
            className="w-full max-w-md"
          >
            <TabsList className="w-max !rounded-[12px]">
              <TabsTrigger
                value="objective"
                className="gap-2"
              >
                <ListChecks className="h-4 w-4 shrink-0" />
                Choice questions
              </TabsTrigger>
              <TabsTrigger
                value="theory"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                Written questions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <p className="text-xs font-medium text-zinc-500">
            {hasObjective ? "Multiple choice" : "Written responses"}
          </p>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-y-auto">
          {!currentQuestion ? (
            <p className="text-sm text-zinc-500">No questions in this section.</p>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                <h2 className="text-lg font-semibold text-zinc-800">
                  Question {activeIndex + 1}
                  {isStudentTheoryQuestion(currentQuestion) && (
                    <span className="ml-2 text-xs font-normal text-amber-800/90">
                      ({currentQuestion.points} pts)
                    </span>
                  )}
                </h2>
                <p className="text-[15px] leading-relaxed text-zinc-700">
                  {currentQuestion.question}
                </p>
              </div>

              {isStudentObjectiveQuestion(currentQuestion) ? (
                <div className="mt-2 space-y-2" role="listbox" aria-label="Answer choices">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setAnswer(currentQuestion.id, option.id);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl cursor-pointer border transition-colors",
                        answers[currentQuestion.id] === option.id
                          ? "bg-zinc-800 text-white border-zinc-800"
                          : "bg-white border-zinc-200/90 hover:border-zinc-300"
                      )}
                      onClick={() => setAnswer(currentQuestion.id, option.id)}
                    >
                      <label className="flex items-start gap-3 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`option-${currentQuestion.id}`}
                          checked={answers[currentQuestion.id] === option.id}
                          onChange={() =>
                            setAnswer(currentQuestion.id, option.id)
                          }
                          className="accent-zinc-700 w-5 h-5 mt-0.5 shrink-0"
                        />
                        <span>{option.text}</span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  <label
                    htmlFor={`theory-${currentQuestion.id}`}
                    className="text-sm font-medium text-zinc-700"
                  >
                    Your answer
                  </label>
                  <div id={`theory-${currentQuestion.id}`}>
                    <TheoryAnswerEditor
                      key={currentQuestion.id}
                      questionId={currentQuestion.id}
                      value={answers[currentQuestion.id] ?? ""}
                      onChange={(encoded) =>
                        setAnswer(currentQuestion.id, encoded)
                      }
                    />
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-wrap justify-end gap-3">
                <Button
                  onClick={handlePrev}
                  disabled={
                    section === "objective"
                      ? objectiveIndex === 0
                      : !hasObjective && theoryIndex === 0
                  }
                  variant="secondary"
                  className="rounded-full"
                >
                  Previous
                </Button>
                {activeIndex === activeList.length - 1 &&
                !(section === "objective" && hasTheory) ? (
                  <Button
                    onClick={openSubmitModal}
                    className="rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    Finish
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    {section === "objective" && hasTheory && activeIndex === activeList.length - 1
                      ? "Continue to Theory"
                      : "Next"}
                  </Button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="hidden md:block w-4/12 p-4 overflow-y-auto bg-white border-l border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">
            {section === "objective" ? "Multiple choice" : "Written"}
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {activeList.map((question, index) => {
              const answered = isStudentObjectiveQuestion(question)
                ? Boolean(answers[question.id])
                : Boolean(
                    theoryAnswerToPlainText(answers[question.id] ?? "")
                  );
              return (
                <div
                  key={question.id}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer text-xs font-medium transition-colors min-h-10 min-w-10",
                    activeIndex === index && "ring-2 ring-offset-2 ring-zinc-800",
                    answered
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-200 text-zinc-700"
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        markingNote={
          test.autoMarkOnSubmit === false
            ? "Your instructor will mark this test later. You will not see a score right away."
            : undefined
        }
        onConfirm={async () => {
          if (test && student && student.id) {
            setIsSubmitting(true);
            try {
              await testService.submitTest(test.id, student.id, answers);
              clearTest();
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
