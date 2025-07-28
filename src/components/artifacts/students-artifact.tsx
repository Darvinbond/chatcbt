"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types/test";
import { Button } from "@/components/ui/button";
import { StudentList } from "@/components/features/test-creation/student-list";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";
import { useArtifact } from "@/components/providers/artifact-provider";

interface StudentsArtifactProps {
  testId: string;
}

export function StudentsArtifact({ testId }: StudentsArtifactProps) {
  const { poolData, setPoolData, hide: hideArtifact } = useArtifact();
  const { students = [], deletedStudentIds = [] } = poolData || {};

  const onStudentsChange = (students: Student[]) => {
    setPoolData({ ...poolData, students });
  };

  const onDeleteStudent = (studentId: string) => {
    const newDeletedStudentIds = [...deletedStudentIds, studentId];
    setPoolData({
      ...poolData,
      deletedStudentIds: newDeletedStudentIds,
    });
  };

  const onUndoDeleteStudent = (studentId: string) => {
    const newDeletedStudentIds = deletedStudentIds.filter(
      (id: string) => id !== studentId
    );
    setPoolData({ ...poolData, deletedStudentIds: newDeletedStudentIds });
  };

  const saveStudentsMutation = useMutation({
    mutationFn: async (data: {
      testId: string;
      students: Student[];
      deletedStudentIds: string[];
    }) => {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save students");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      hideArtifact();
    },
    onError: () => {
      toast.error("Failed to save students. Please try again.");
    },
  });

  const handleSave = () => {
    saveStudentsMutation.mutate({ testId, students, deletedStudentIds });
  };

  return (
    <StudentList
      students={students}
      deletedStudentIds={deletedStudentIds}
      onStudentsChange={onStudentsChange}
      onDeleteStudent={onDeleteStudent}
      onUndoDeleteStudent={onUndoDeleteStudent}
    />
  );
}
