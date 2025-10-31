import { motion, Reorder, useDragControls } from 'motion/react'
import { GripVertical, Trash2, Undo2, Plus } from 'lucide-react'
import { EditableText } from '@/components/ui/editable-text'
import { DraggableOption } from '@/components/ui/draggable-option'
import { Question, Option } from '@/types/test'
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
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing"
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
