'use client'

import { Reorder } from 'motion/react'
import { DraggableQuestion } from './draggable-question'
import { Question } from '@/types/test'
import { useArtifact } from '@/components/providers/artifact-provider'

interface QuestionEditorProps {}

export function QuestionEditor({}: QuestionEditorProps) {
  const { poolData, setPoolData } = useArtifact();
  const questions = poolData?.questions || [];

  const onQuestionsChange = (newQuestions: Question[]) => {
    setPoolData({ ...poolData, questions: newQuestions });
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    const newQuestions = questions.map((q: Question) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    onQuestionsChange(newQuestions);
  };

  const handleReorderQuestions = (newQuestions: Question[]) => {
    onQuestionsChange(newQuestions);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const newDeletedQuestionIds = [...(poolData.deletedQuestionIds || []), questionId];
    setPoolData({
      ...poolData,
      deletedQuestionIds: newDeletedQuestionIds,
    });
  };

  const handleUndoDeleteQuestion = (questionId: string) => {
    const newDeletedQuestionIds = (poolData.deletedQuestionIds || []).filter(
      (id: string) => id !== questionId
    );
    setPoolData({
      ...poolData,
      deletedQuestionIds: newDeletedQuestionIds,
    });
  };

  return (
    <div className="w-full">
      <Reorder.Group axis="y" values={questions} onReorder={handleReorderQuestions}>
        {questions.map((question: Question, questionIndex: number) => (
          <DraggableQuestion
            key={question.id || questionIndex}
            question={question}
            onUpdate={handleUpdateQuestion}
            onDelete={handleDeleteQuestion}
            onUndoDelete={handleUndoDeleteQuestion}
            isDeleted={(poolData.deletedQuestionIds || []).includes(question.id)}
            index={questionIndex}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
