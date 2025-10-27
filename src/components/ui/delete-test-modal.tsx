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
import { Input } from "@/components/ui/input";
import { Test } from "@/types/test";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test;
}

export function DeleteTestModal({
  isOpen,
  onClose,
  test,
}: DeleteTestModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await fetch(`/api/tests/${testId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete test");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Test deleted successfully");
      onClose();
      // Redirect to home
      router.push("/");
    },
    onError: () => {
      toast.error("Failed to delete test. Please try again.");
    },
  });

  const handleDelete = () => {
    if (confirmText !== test.title) {
      toast.error("Test name does not match. Please type the exact test name.");
      return;
    }
    deleteTestMutation.mutate(test.id);
  };

  const isConfirmDisabled = confirmText !== test.title || deleteTestMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Test</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the test "{test.title}" and remove all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-2">This will remove:</div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Questions and answers</li>
              <li>Student list</li>
              <li>All attempt records</li>
            </ul>
            <div className="mt-4 font-medium">
              To confirm deletion, please type the test name: <strong>{test.title}</strong>
            </div>
          </div>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${test.title}" to confirm`}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isConfirmDisabled}
            isLoading={deleteTestMutation.isPending}
            className="rounded-full"
          >
            Yes, Delete Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
