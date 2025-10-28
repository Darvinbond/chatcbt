"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Test, Student } from "@/types/test";

interface TestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: () => void;
  isStartingTest?: boolean;
  test: Test;
  student: Student;
}

export function TestDetailsModal({
  isOpen,
  onClose,
  onStartTest,
  isStartingTest = false,
  test,
  student,
}: TestDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[20px]">
        <DialogHeader>
          <DialogTitle>You are about to start the test</DialogTitle>
          <DialogDescription>
            By clicking the "Start Test" button, the test will immediately begin.
          </DialogDescription>
        </DialogHeader>
        <div className="text-[14px]">
          <p>
            <strong>Student:</strong> {student.name}
          </p>
          <p>
            <strong>Test:</strong> {test.title}
          </p>
          <p>
            <strong>Duration:</strong> {test.duration} minutes
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={onStartTest}
            isLoading={isStartingTest}
            className="rounded-full"
          >
            Start Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
