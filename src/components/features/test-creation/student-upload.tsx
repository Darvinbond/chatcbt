"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/kokonutui/file-upload";
import { Button } from "@/components/ui/button";
import { parseStudentData } from "@/services/file/parser.service";

interface StudentUploadProps {
  onStudentsUploaded: (studentNames: string[], fileName: string) => void;
}

export function StudentUpload({ onStudentsUploaded }: StudentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleUploadSuccess = async (uploadedFile: File) => {
    setFile(uploadedFile);
    try {
      const studentNames = await parseStudentData(uploadedFile);
      toast.success(`${studentNames.length} students processed successfully.`);
      onStudentsUploaded(studentNames, uploadedFile.name);
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to process student data.");
    }
  };

  return (
    <div className="w-full">
      <div className={cn(isSubmitted && "pointer-events-none opacity-50")}>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          acceptedFileTypes={["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]}
          className="mb-4"
          currentFile={file}
          uploadDelay={0}
        />
      </div>
    </div>
  );
}
