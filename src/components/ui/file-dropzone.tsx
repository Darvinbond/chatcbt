import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { UploadCloud } from 'lucide-react';

interface FileDropzoneProps {
  onFile: (file: File) => void;
  className?: string;
}

export function FileDropzone({ onFile, className }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      className={cn(
        'w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors',
        isDragActive ? 'border-primary bg-primary/10' : '',
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <input type="file" id="file-upload" className="hidden" onChange={handleChange} />
      <label htmlFor="file-upload" className="cursor-pointer text-center">
        <UploadCloud className="mx-auto h-12 w-12" />
        <p className="mt-2">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs">Excel or CSV file</p>
      </label>
    </motion.div>
  );
}
