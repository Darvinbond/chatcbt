import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EditableText({ value, onChange, className }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResizeTextarea();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleBlur();
    }
  };

  return (
    <div className={cn('relative w-full group', className)} onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <motion.textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResizeTextarea();
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={autoResizeTextarea}
          className="w-full max-w-full p-0 bg-transparent outline-none text-sm resize-none overflow-hidden min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          rows={1}
        />
      ) : (
        <motion.span
          className="cursor-pointer border-b border-dashed border-zinc-300 pb-1 group-hover:border-black text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {value}
        </motion.span>
      )}
    </div>
  );
}
