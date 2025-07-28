import { motion } from 'motion/react';

interface Question {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  points: number;
}

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
          <p className="font-medium">{index + 1}. {q.question}</p>
          <div className="mt-2 space-y-1">
            {q.options.map(opt => (
              <div key={opt.id} className={`text-sm ${opt.isCorrect ? 'text-green-600 font-semibold' : ''}`}>
                - {opt.text}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
