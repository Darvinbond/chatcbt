import { motion } from 'motion/react';
import type { Question } from '@/types/test';
import { isTheoryQuestion } from '@/types/test';

interface QuestionPreviewProps {
  questions: Question[];
}

export function QuestionPreview({ questions }: QuestionPreviewProps) {
  return (
    <div className="space-y-4">
      {questions && questions.map((q, index) => (
        <motion.div
          key={q.id}
          className="p-4 border rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {isTheoryQuestion(q) ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90 mb-1">
                Written response · {q.points} pts
              </p>
              <p className="font-medium">{index + 1}. {q.question}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{index + 1}. {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map(opt => (
                  <div key={opt.id} className={`text-sm ${opt.isCorrect ? 'text-green-600 font-semibold' : ''}`}>
                    - {opt.text}
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
