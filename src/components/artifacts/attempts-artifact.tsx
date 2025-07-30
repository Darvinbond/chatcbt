"use client";

import { Attempt, Test } from "@/types/test";
import { Trash2, Undo2 } from "lucide-react";
import { useArtifact } from "@/components/providers/artifact-provider";
import { cn } from "@/lib/utils";

interface AttemptsArtifactProps {
  attempts: Attempt[];
  test: Test;
}

export function AttemptsArtifact({ attempts, test }: AttemptsArtifactProps) {
  const { poolData, setPoolData } = useArtifact();
  const { deletedAttemptIds = [] } = poolData || {};

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
      {attempts.map((attempt) => (
        <div
          key={attempt.id}
          className={cn("p-4 border-b border-zinc-200 border-dashed", {
            "border-red-500": deletedAttemptIds.includes(attempt.id),
          })}
        >
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{attempt.student.name}</p>
            <div className="flex items-center gap-4">
              <p className="text-sm text-zinc-500">
                {attempt.score} / {test.questions.length}
              </p>
              {deletedAttemptIds.includes(attempt.id) ? (
                <button onClick={() => onUndoDelete(attempt.id)} className="cursor-pointer">
                  <Undo2 className="h-4 w-4 text-gray-400" />
                </button>
              ) : (
                <button onClick={() => onDelete(attempt.id)} className="cursor-pointer">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-zinc-500">
              {attempt.duration} minutes
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
