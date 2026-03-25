'use client'

import { Reorder } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { DraggableQuestion } from './draggable-question'
import { Question, isObjectiveQuestion, isTheoryQuestion } from '@/types/test'
import { useArtifact } from '@/components/providers/artifact-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function QuestionEditor() {
  const { poolData, setPoolData, setHeaderSlot } = useArtifact()
  const questions = (poolData?.questions || []) as Question[]
  const [tab, setTab] = useState('objective')

  const objectiveQs = useMemo(
    () => questions.filter(isObjectiveQuestion),
    [questions]
  )
  const theoryQs = useMemo(() => questions.filter(isTheoryQuestion), [questions])

  const patchPool = useCallback(
    (partial: { questions?: Question[]; deletedQuestionIds?: string[] }) => {
      setPoolData({
        ...(poolData ?? {}),
        ...partial,
      })
    },
    [poolData, setPoolData]
  )

  const mergeSections = useCallback(
    (nextObjective: Question[], nextTheory: Question[]) => {
      patchPool({ questions: [...nextObjective, ...nextTheory] })
    },
    [patchPool]
  )

  const handleAddObjective = useCallback(() => {
    const newQuestion: Question = {
      id: uuidv4(),
      question: 'New question',
      options: [],
      type: 'multiple-choice',
      points: 1,
    }
    mergeSections(
      [...objectiveQs, newQuestion],
      theoryQs
    )
  }, [mergeSections, objectiveQs, theoryQs])

  const handleAddTheory = useCallback(() => {
    const newQuestion: Question = {
      id: uuidv4(),
      question: 'New written-response question',
      type: 'theory',
      points: 8,
    }
    mergeSections(objectiveQs, [...theoryQs, newQuestion])
  }, [mergeSections, objectiveQs, theoryQs])

  useEffect(() => {
    const onAdd = () => {
      if (tab === 'objective') handleAddObjective()
      else handleAddTheory()
    }
    setHeaderSlot(
      <Button
        type="button"
        variant="outline"
        className="rounded-full gap-1.5 shrink-0"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        {tab === 'objective' ? 'Add choice question' : 'Add written question'}
      </Button>
    )
  }, [tab, setHeaderSlot, handleAddObjective, handleAddTheory])

  useEffect(() => {
    return () => setHeaderSlot(null)
  }, [setHeaderSlot])

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    patchPool({
      questions: questions.map((q: Question) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      ),
    })
  }

  const handleReorderObjective = (reordered: Question[]) => {
    mergeSections(reordered, theoryQs)
  }

  const handleReorderTheory = (reordered: Question[]) => {
    mergeSections(objectiveQs, reordered)
  }

  const handleDeleteQuestion = (questionId: string) => {
    const next = [...(poolData?.deletedQuestionIds || []), questionId]
    patchPool({ deletedQuestionIds: next })
  }

  const handleUndoDeleteQuestion = (questionId: string) => {
    const next = (poolData?.deletedQuestionIds || []).filter(
      (id: string) => id !== questionId
    )
    patchPool({ deletedQuestionIds: next })
  }

  const deletedIds: string[] = poolData?.deletedQuestionIds || []

  return (
    <div className="w-full space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-11 w-full max-w-xl flex-row items-stretch gap-1 rounded-lg bg-muted p-1">
          <TabsTrigger
            value="objective"
            className="flex-1 basis-0 rounded-md px-3 text-xs font-medium shadow-none transition-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm"
          >
            <span className="truncate">
              Choice questions
              <span className="ml-1 tabular-nums text-muted-foreground">
                ({objectiveQs.length})
              </span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="theory"
            className="flex-1 basis-0 rounded-md px-3 text-xs font-medium shadow-none transition-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm"
          >
            <span className="truncate">
              Written questions
              <span className="ml-1 tabular-nums text-muted-foreground">
                ({theoryQs.length})
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objective" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Multiple-choice, true/false, or fill-in-the-blank. Drag to reorder. Use
            the button in the panel header to add questions.
          </p>
          {objectiveQs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
              No choice questions yet. Add one with the header button.
            </p>
          ) : (
            <Reorder.Group
              axis="y"
              values={objectiveQs}
              onReorder={handleReorderObjective}
            >
              {objectiveQs.map((question: Question, questionIndex: number) => (
                <DraggableQuestion
                  key={question.id || questionIndex}
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onUndoDelete={handleUndoDeleteQuestion}
                  isDeleted={deletedIds.includes(question.id)}
                  index={questionIndex}
                />
              ))}
            </Reorder.Group>
          )}
        </TabsContent>

        <TabsContent value="theory" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Long-form answers (rich text for students). Optional AI marking notes stay
            private to teachers. Add questions from the header button.
          </p>
          {theoryQs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-amber-100 rounded-lg bg-amber-50/30">
              No written questions yet. Add one with the header button.
            </p>
          ) : (
            <Reorder.Group
              axis="y"
              values={theoryQs}
              onReorder={handleReorderTheory}
            >
              {theoryQs.map((question: Question, questionIndex: number) => (
                <DraggableQuestion
                  key={question.id || questionIndex}
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onUndoDelete={handleUndoDeleteQuestion}
                  isDeleted={deletedIds.includes(question.id)}
                  index={questionIndex}
                />
              ))}
            </Reorder.Group>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
