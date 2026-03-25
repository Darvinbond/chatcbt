"use client";

import { useState } from "react";
import { Attempt, Test } from "@/types/test";
import { Eye, Trash2, Undo2 } from "lucide-react";
import { useArtifact } from "@/components/providers/artifact-provider";
import { cn } from "@/lib/utils";
import { AttemptReviewOverlay } from "@/components/artifacts/attempt-review-overlay";

interface AttemptsArtifactProps {
  attempts: Attempt[];
  test: Test;
}

export function AttemptsArtifact({ attempts, test }: AttemptsArtifactProps) {
  const { poolData, setPoolData } = useArtifact();
  const { deletedAttemptIds = [] } = poolData || {};
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const reviewAttempt =
    reviewAttemptId == null
      ? null
      : attempts.find((a) => a.id === reviewAttemptId) ?? null;

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

  return (
    <div className="space-y-2">
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
          <div className="flex justify-between items-center gap-2">
            <p className="text-sm font-medium">{attempt.student.name}</p>
            <div className="flex items-center gap-2 sm:gap-4">
              <p className="text-sm text-zinc-500 tabular-nums">
                {attempt.score} / {test.questions.length}
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
              {attempt.duration != null ? `${attempt.duration} min` : '—'}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(attempt.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
