"use client";

import { Attempt, Test } from "@/types/test";

interface AttemptsArtifactProps {
  attempts: Attempt[];
  test: Test;
}

export function AttemptsArtifact({ attempts, test }: AttemptsArtifactProps) {
  return (
    <div className="space-y-2">
      {attempts.map((attempt) => (
        <div key={attempt.id} className="p-4 border-b border-zinc-200 border-dashed">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{attempt.student.name}</p>
            <p className="text-sm text-zinc-500">{attempt.score} / {test.questions.length}</p>
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
