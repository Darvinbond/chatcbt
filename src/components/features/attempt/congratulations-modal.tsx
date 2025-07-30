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

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CongratulationsModal({
  isOpen,
  onClose,
}: CongratulationsModalProps) {
  const handleClose = () => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("ref");
    window.history.replaceState({}, "", `${window.location.pathname}?${urlParams.toString()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm rounded-[20px]">
        <DialogHeader>
          <div className="flex justify-center">
            <span className="text-6xl">👏</span>
          </div>
          <DialogTitle className="text-center">Congratulations!</DialogTitle>
          <DialogDescription className="text-center">
            You have successfully submitted the test.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="rounded-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
