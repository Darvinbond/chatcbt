'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { TheoryAnswerStatic } from '@/components/features/attempt/theory-answer-static';
import { cn } from '@/lib/utils';
import type { Attempt, Question } from '@/types/test';
import { isObjectiveQuestion, isTheoryQuestion } from '@/types/test';

function normalizeAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = typeof v === 'string' ? v : String(v ?? '');
  }
  return out;
}

function maxPointsForQuestion(q: Question): number {
  return q.points ?? (isTheoryQuestion(q) ? 5 : 1);
}

function totalMaxPoints(questions: Question[]): number {
  return questions.reduce((s, q) => s + maxPointsForQuestion(q), 0);
}

type AttemptReviewOverlayProps = {
  attempt: Attempt;
  questions: Question[];
  onClose: () => void;
};

export function AttemptReviewOverlay({
  attempt,
  questions,
  onClose,
}: AttemptReviewOverlayProps) {
  const answers = normalizeAnswers(attempt.answers as unknown);
  const meta = attempt.gradingMetadata;
  const maxTotal = totalMaxPoints(questions);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    try {
      const { downloadAttemptPdf } = await import('@/lib/attempt-pdf');
      await downloadAttemptPdf(attempt, questions);
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  }, [attempt, questions]);

  const objectiveQs = questions.filter(isObjectiveQuestion);
  const theoryQs = questions.filter(isTheoryQuestion);

  const content = (
    <div
      className="fixed inset-0 z-[300] flex min-h-0 flex-col bg-[#fafafa] text-zinc-900"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attempt-review-title"
    >
      <header className="z-10 flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200/80 bg-[#fafafa]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="min-w-0 space-y-0.5">
          <h1
            id="attempt-review-title"
            className="truncate text-lg font-semibold tracking-tight text-zinc-900"
          >
            {attempt.student.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {attempt.submittedAt
              ? `Submitted ${new Date(attempt.submittedAt).toLocaleString()}`
              : "Not submitted"}
            {attempt.duration != null ? (
              <span className="text-zinc-400"> · {attempt.duration} min</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <p className="text-right text-sm tabular-nums text-zinc-600">
            <span className="font-medium text-zinc-900">
              {attempt.score != null ? Math.round(attempt.score * 10) / 10 : '—'}
            </span>
            <span className="text-zinc-400"> / </span>
            {maxTotal} pts
          </p>
          <Button
            className="rounded-full"
            onClick={handlePrint}
            isLoading={isPrinting}
          >
            Print
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="Close review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-6">
        <div className="mx-auto box-border h-full min-h-0 w-[min(100%,42rem)] overflow-y-auto px-2 py-10 pb-24 sm:px-4">
        {objectiveQs.length > 0 ? (
          <section className="mb-16">
            <h2 className="mb-8 text-lg font-semibold text-black">
              Objective questions
            </h2>
            <ol className="space-y-12">
              {objectiveQs.map((q) => {
                const globalIndex = questions.indexOf(q) + 1;
                const chosenId = answers[q.id];
                const correctOpt = q.options.find((o) => o.isCorrect);
                const isCorrect =
                  Boolean(correctOpt && chosenId && chosenId === correctOpt.id);
                const pts = maxPointsForQuestion(q);
                const earned = isCorrect ? pts : 0;

                return (
                  <li key={q.id} className="list-none">
                    <p className="text-base font-medium leading-snug text-zinc-900">
                      <span className="mr-2 tabular-nums text-zinc-400">
                        {globalIndex}.
                      </span>
                      {q.question}
                    </p>
                    <ul className="mt-5 space-y-3">
                      {q.options.map((opt, optIdx) => {
                        const chosen = opt.id === chosenId;
                        const correct = opt.isCorrect;
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <li
                            key={opt.id}
                            className="flex flex-wrap items-baseline gap-2 text-[15px] leading-relaxed"
                          >
                            <span
                              className={cn(
                                correct
                                  ? 'font-semibold text-green-600'
                                  : 'text-zinc-700'
                              )}
                            >
                              {letter}. {opt.text}
                            </span>
                            {chosen ? (
                              <span className="inline-flex shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                                Selected
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    <p
                      className={cn(
                        'mt-4 text-sm font-medium',
                        isCorrect ? 'text-emerald-700' : 'text-rose-700'
                      )}
                    >
                      {isCorrect
                        ? `Correct — ${earned} / ${pts} pts`
                        : `Incorrect — 0 / ${pts} pts`}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {theoryQs.length > 0 ? (
          <section>
            <h2 className="mb-8 text-lg font-semibold text-black">
              Theory questions
            </h2>
            <ol className="space-y-14">
              {theoryQs.map((q) => {
                const globalIndex = questions.indexOf(q) + 1;
                const raw = answers[q.id] ?? '';
                const mark = meta?.theory?.[q.id];
                const max = maxPointsForQuestion(q);

                return (
                  <li key={q.id} className="list-none">
                    <p className="text-base font-medium leading-snug text-zinc-900">
                      <span className="mr-2 tabular-nums text-zinc-400">
                        {globalIndex}.
                      </span>
                      {q.question}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Max {max} pts
                    </p>
                    <div className="mt-5">
                      <TheoryAnswerStatic encoded={raw} />
                    </div>
                    <div className="mt-5 rounded-lg border border-zinc-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Score
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900">
                        {mark
                          ? `${mark.earned} / ${mark.max} pts`
                          : 'Not graded (no mark on record)'}
                      </p>
                      {mark?.comment ? (
                        <>
                          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Rationale
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                            {mark.comment}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
