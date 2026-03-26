"use client";

import { useState, useEffect } from "react";
import { Attempt, Question, Test } from "@/types/test";
import { Eye, Trash2, Undo2, Loader2 } from "lucide-react";
import { useArtifact } from "@/components/providers/artifact-provider";
import { cn } from "@/lib/utils";
import { AttemptReviewOverlay } from "@/components/artifacts/attempt-review-overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { testService } from "@/services/test.service";
import { toast } from "sonner";

function testMaxPoints(questions: Question[]): number {
  return questions.reduce((s, q) => {
    if (q.type === "theory") return s + (q.points ?? 5);
    return s + (q.points ?? 1);
  }, 0);
}

interface AttemptsArtifactProps {
  attempts: Attempt[];
  test: Test;
  onAttemptsMarked?: () => void;
}

export function AttemptsArtifact({
  attempts,
  test,
  onAttemptsMarked,
}: AttemptsArtifactProps) {
  const { poolData, setPoolData, setHeaderSlot } = useArtifact();
  const { deletedAttemptIds = [] } = poolData || {};
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [confirmMarkOpen, setConfirmMarkOpen] = useState(false);
  const [markingOpen, setMarkingOpen] = useState(false);

  const reviewAttempt =
    reviewAttemptId == null
      ? null
      : attempts.find((a) => a.id === reviewAttemptId) ?? null;

  const maxPts = testMaxPoints(test.questions);

  const unmarkedCount = attempts.filter(
    (a) =>
      a.submittedAt != null &&
      a.score == null &&
      !deletedAttemptIds.includes(a.id)
  ).length;

  const showMarkFlow = test.autoMarkOnSubmit === false;

  useEffect(() => {
    if (!showMarkFlow) {
      setHeaderSlot(null);
      return;
    }
    setHeaderSlot(
      <Button
        type="button"
        variant="secondary"
        className="rounded-full shrink-0"
        disabled={unmarkedCount === 0}
        onClick={() => setConfirmMarkOpen(true)}
      >
        Mark test
      </Button>
    );
    return () => setHeaderSlot(null);
  }, [showMarkFlow, unmarkedCount, setHeaderSlot]);

  const onDelete = (attemptId: string) => {
    const newDeletedAttemptIds = [...deletedAttemptIds, attemptId];
    setPoolData({ ...poolData, deletedAttemptIds: newDeletedAttemptIds });
  };

  const onUndoDelete = (attemptId: string) => {
    const newDeletedAttemptIds = deletedAttemptIds.filter(
      (id: string) => id !== attemptId
    );
    setPoolData({ ...poolData, deletedAttemptIds: newDeletedAttemptIds });
  };

  const runMarkTest = async () => {
    setConfirmMarkOpen(false);
    setMarkingOpen(true);
    try {
      const res = await testService.markSubmittedAttempts(test.id);
      if (res.success && res.data) {
        const { marked, errorAttemptIds } = res.data;
        if (marked > 0) {
          toast.success(
            `Marked ${marked} attempt${marked === 1 ? "" : "s"}${
              errorAttemptIds.length > 0
                ? ` (${errorAttemptIds.length} could not be marked)`
                : ""
            }`
          );
        } else {
          toast.error("Could not mark attempts. Try again.");
        }
        onAttemptsMarked?.();
      }
    } catch {
      toast.error("Failed to mark attempts.");
    } finally {
      setMarkingOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={confirmMarkOpen} onOpenChange={setConfirmMarkOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle>Mark all unmarked attempts?</DialogTitle>
            <DialogDescription>
              This will score every submitted attempt that does not have a score yet
              ({unmarkedCount} attempt{unmarkedCount === 1 ? "" : "s"}). Theory
              answers are graded with AI; this may take a minute.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmMarkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => void runMarkTest()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={markingOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-sm rounded-[20px]"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Marking attempts</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Please wait while answers are scored…
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {reviewAttempt ? (
        <AttemptReviewOverlay
          attempt={reviewAttempt}
          questions={test.questions}
          onClose={() => setReviewAttemptId(null)}
        />
      ) : null}
      {attempts.map((attempt) => (
        <div
          key={attempt.id}
          className={cn("p-4 border-b border-zinc-200 border-dashed", {
            "border-red-500": deletedAttemptIds.includes(attempt.id),
          })}
        >
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium truncate">{attempt.student.name}</p>
              {test.autoMarkOnSubmit === false &&
              attempt.submittedAt != null &&
              attempt.score == null &&
              !deletedAttemptIds.includes(attempt.id) ? (
                <span className="text-[11px] font-medium uppercase tracking-wide rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 shrink-0">
                  Unmarked
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <p className="text-sm text-zinc-500 tabular-nums">
                {attempt.submittedAt == null
                  ? "—"
                  : attempt.score == null
                    ? "—"
                    : `${attempt.score} / ${maxPts}`}
              </p>
              {!deletedAttemptIds.includes(attempt.id) ? (
                <button
                  type="button"
                  onClick={() => setReviewAttemptId(attempt.id)}
                  className="m-0 cursor-pointer border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                  title="View attempt"
                  aria-label={`View answers for ${attempt.student.name}`}
                >
                  <Eye className="h-4 w-4 text-zinc-500" />
                </button>
              ) : null}
              {deletedAttemptIds.includes(attempt.id) ? (
                <button
                  type="button"
                  onClick={() => onUndoDelete(attempt.id)}
                  className="cursor-pointer rounded-lg p-1.5 hover:bg-zinc-100"
                  aria-label="Undo delete"
                >
                  <Undo2 className="h-4 w-4 text-gray-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(attempt.id)}
                  className="cursor-pointer rounded-lg p-1.5 hover:bg-red-50"
                  aria-label="Mark attempt for deletion"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-zinc-500">
              {attempt.duration != null ? `${attempt.duration} min` : "—"}
            </p>
            <p className="text-xs text-zinc-500">
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString()
                : "Not submitted"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
