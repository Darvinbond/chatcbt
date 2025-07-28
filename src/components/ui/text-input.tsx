import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TextInput({ value, onChange, className }: TextInputProps) {
  return (
    <motion.textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full h-full p-4 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      placeholder="Paste your text here..."
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  );
}
