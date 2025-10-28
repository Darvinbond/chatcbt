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

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: SubmitConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-[20px]">
        <DialogHeader>
          <DialogTitle>Are you sure you want to submit?</DialogTitle>
          <DialogDescription>
            You will not be able to change your answers after submitting.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isSubmitting}
            className="rounded-full"
          >
            Yes, Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
