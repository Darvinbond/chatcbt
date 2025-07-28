"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/kokonutui/file-upload";
import { Button } from "@/components/ui/button";
import { parseStudentData } from "@/services/file/parser.service";

interface StudentUploadProps {
  onStudentsUploaded: (studentNames: string[]) => void;
}

export function StudentUpload({ onStudentsUploaded }: StudentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleProcess = async () => {
    if (!file) {
      toast.error("Please upload an Excel file.");
      return;
    }
    try {
      const studentNames = await parseStudentData(file);
      toast.success(`${studentNames.length} students processed successfully.`);
      onStudentsUploaded(studentNames);
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to process student data.");
    }
  };

  return (
    <div className="w-full">
      <div className={cn(isSubmitted && "pointer-events-none opacity-50")}>
        <FileUpload
          onUploadSuccess={(file) => setFile(file)}
          acceptedFileTypes={["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"]}
          className="mb-4"
        />
      </div>
      {!isSubmitted && (
        <Button onClick={handleProcess} className="w-max mt-4 rounded-full">
          Process Students
        </Button>
      )}
    </div>
  );
}
