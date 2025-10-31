import { motion, Reorder, useDragControls } from 'motion/react';
import { GripVertical, X } from 'lucide-react';
import { EditableText } from './editable-text';

interface DraggableOptionProps {
  option: { id: string; text: string; isCorrect: boolean };
  onUpdate: (option: { id: string; text: string; isCorrect: boolean }) => void;
  onDelete: (optionId: string) => void;
  questionId: string;  // Add questionId prop
}

export function DraggableOption({ option, onUpdate, onDelete, questionId }: DraggableOptionProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={option}
      id={option.id}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 p-2 rounded-md"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <input
        type="radio"
        name={`correct-option-${questionId}`}
        checked={option.isCorrect}
        onChange={() => onUpdate({ ...option, isCorrect: !option.isCorrect })}
        className="accent-zinc-950"
      />
      <EditableText
        value={option.text}
        onChange={(text) => onUpdate({ ...option, text })}
        className="flex-1 group"
      />
      <X
        className="h-4 w-4 text-gray-400 cursor-pointer"
        onClick={() => onDelete(option.id)}
      />
    </Reorder.Item>
  );
}
