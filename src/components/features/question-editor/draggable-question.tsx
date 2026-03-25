import { Reorder, useDragControls } from 'motion/react'
import { GripVertical, Trash2, Undo2, Plus } from 'lucide-react'
import { EditableText } from '@/components/ui/editable-text'
import { DraggableOption } from '@/components/ui/draggable-option'
import { Question, Option, isTheoryQuestion, isObjectiveQuestion } from '@/types/test'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from 'uuid'

interface DraggableQuestionProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: (questionId: string) => void
  onUndoDelete: (questionId: string) => void
  isDeleted: boolean
  index: number
}

export function DraggableQuestion({ question, onUpdate, onDelete, onUndoDelete, isDeleted, index }: DraggableQuestionProps) {
  const controls = useDragControls()

  if (isTheoryQuestion(question)) {
    return (
      <Reorder.Item
        value={question}
        id={question.id}
        dragListener={false}
        dragControls={controls}
        className="bg-white rounded-lg mb-3 border border-amber-100/80 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        initial={false}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 p-4">
            <span className="text-sm font-medium text-amber-900/80 min-w-[24px]">
              {index + 1}.
            </span>
            <button
              type="button"
              onPointerDown={(e) => controls.start(e)}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-amber-700/50" />
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-4 py-4 pr-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/90">
                  Written response
                </span>
                <EditableText
                  value={question.question}
                  onChange={(text) => onUpdate({ ...question, question: text })}
                  className="font-medium text-base text-zinc-900"
                />
              </div>
              <div className="flex w-[50px] shrink-0 flex-col gap-1">
                <Label className="block text-center text-[10px] font-medium leading-tight text-zinc-600">
                  Max pts
                </Label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="h-9 w-[50px] min-w-[50px] max-w-[50px] rounded-md border border-zinc-200 bg-white px-1 text-center text-sm tabular-nums"
                  value={question.points}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n) && n > 0) {
                      onUpdate({ ...question, points: n })
                    }
                  }}
                />
              </div>
              {isDeleted ? (
                <div className="flex shrink-0 flex-col items-center gap-1 pt-6">
                  <span className="text-xs text-red-500">Deleted</span>
                  <Undo2
                    className="h-4 w-4 cursor-pointer text-gray-400"
                    onClick={() => onUndoDelete(question.id)}
                  />
                </div>
              ) : (
                <Trash2
                  className="mt-6 h-5 w-5 shrink-0 cursor-pointer text-gray-400"
                  onClick={() => onDelete(question.id)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">
                Marking notes for the AI (optional)
              </Label>
              <p className="text-xs leading-snug text-zinc-400">
                Students never see this. Use it to tell the grader what a strong answer should include.
              </p>
              <Textarea
                value={question.markingGuide ?? ''}
                onChange={(e) =>
                  onUpdate({ ...question, markingGuide: e.target.value || undefined })
                }
                placeholder="e.g. Award full marks only if they define X, give two examples, and address limitation Y."
                className="h-[100px] min-h-[100px] resize-y text-sm"
              />
            </div>
          </div>
        </div>
      </Reorder.Item>
    )
  }

  if (!isObjectiveQuestion(question)) {
    return null
  }

  return (
    <Reorder.Item
      value={question}
      id={question.id}
      dragListener={false}
      dragControls={controls}
      className="bg-white rounded-lg mb-3"
      initial={false}
      animate={{
        boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
        borderWidth: "0px",
        borderColor: "transparent",
        padding: "0px",
        scale: 1,
        transition: {
          duration: 0.2,
          ease: "easeInOut"
        }
      }}
      whileDrag={{
        zIndex: 50,
        transition: {
          duration: 0.15,
          ease: "easeOut"
        }
      }}
      dragElastic={0.1}
      dragMomentum={false}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 p-4">
          <span className="text-sm font-medium text-gray-600 min-w-[24px]">
            {index + 1}.
          </span>
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 pr-4 py-4">
          <div className="flex items-center justify-between">
            <EditableText
              value={question.question}
              onChange={(text) => onUpdate({ ...question, question: text })}
              className="font-medium mb-3"
            />
            {isDeleted ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Deleted</span>
                <Undo2
                  className="h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => onUndoDelete(question.id)}
                />
              </div>
            ) : (
              <Trash2
                className="h-5 w-5 text-gray-400 cursor-pointer"
                onClick={() => onDelete(question.id)}
              />
            )}
          </div>

          <Reorder.Group
            axis="y"
            values={question.options}
            onReorder={(newOptions: Option[]) => onUpdate({ ...question, options: newOptions })}
          >
            {question.options.map((option: Option) => (
              <DraggableOption
                key={option.id}
                option={option}
                questionId={question.id}
                onUpdate={(updatedOption: Option) => {
                  const newOptions = question.options.map((o: Option) => ({
                    ...o,
                    isCorrect: o.id === updatedOption.id ? updatedOption.isCorrect : (updatedOption.isCorrect && o.isCorrect ? false : o.isCorrect)
                  }));
                  onUpdate({ ...question, options: newOptions });
                }}
                onDelete={(optionId: string) => {
                  const newOptions = question.options.filter(
                    (o: Option) => o.id !== optionId
                  );
                  onUpdate({ ...question, options: newOptions });
                }}
              />
            ))}
          </Reorder.Group>
          <button
            type="button"
            className="mt-2 flex items-center gap-2 text-zinc-500 text-xs border-b border-zinc-300 border-dashed cursor-pointer"
            onClick={() => {
              const newOption = {
                id: uuidv4(),
                text: "New Option",
                isCorrect: false,
              };
              onUpdate({
                ...question,
                options: [...question.options, newOption],
              });
            }}
          >
            <Plus className="h-4 w-4" />
            Add Option
          </button>
        </div>
      </div>
    </Reorder.Item>
  )
}
