"use client";

import { Student } from "@/types/test";
import { EditableText } from "@/components/ui/editable-text";
import { Copy, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: Student[];
  deletedStudentIds: string[];
  onStudentsChange: (students: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
  onUndoDeleteStudent: (studentId: string) => void;
}

export function StudentList({
  students,
  deletedStudentIds,
  onStudentsChange,
  onDeleteStudent,
  onUndoDeleteStudent,
}: StudentListProps) {
  const handleUpdateStudent = (student: Student) => {
    onStudentsChange(
      students.map((s) => (s.id === student.id ? student : s))
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    onDeleteStudent(studentId);
  };

  const handleUndoDeleteStudent = (studentId: string) => {
    onUndoDeleteStudent(studentId);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  return (
    <div>
      <ul>
        {students.map((student, index) => {
          const isDeleted = deletedStudentIds.includes(student.id!);
          return (
            <li
              key={student.id || index}
              className={cn(
                "flex items-center justify-between py-2 border-b border-dashed",
                isDeleted ? "border-red-500" : "border-zinc-200"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">
                  {students.length - index}.
                </span>
                <EditableText
                  value={student.name}
                  onChange={(name) => handleUpdateStudent({ ...student, name })}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">{student.code}</span>
                <div className="flex items-center gap-2 ml-5">
                  <button onClick={() => handleCopyCode(student.code!)} className="cursor-pointer">
                    <Copy className="h-4 w-4 text-zinc-600" />
                  </button>
                  {isDeleted ? (
                    <button
                      onClick={() => handleUndoDeleteStudent(student.id!)}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 text-zinc-600" />
                    </button>
                  ) : (
                    <button onClick={() => handleDeleteStudent(student.id!)} className="cursor-pointer">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
