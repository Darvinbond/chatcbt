import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface ModeSelectorProps {
  mode: 'text' | 'spreadsheet';
  onChange: (mode: 'text' | 'spreadsheet') => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-200">
      <button
        onClick={() => onChange('text')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium',
          mode === 'text' ? 'bg-white text-primary' : 'text-gray-600'
        )}
      >
        Text
      </button>
      <button
        onClick={() => onChange('spreadsheet')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium',
          mode === 'spreadsheet' ? 'bg-white text-primary' : 'text-gray-600'
        )}
      >
        Spreadsheet
      </button>
    </div>
  );
}
