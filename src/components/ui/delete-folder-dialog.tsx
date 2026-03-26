"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/providers/sidebar-provider";

type DeleteFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  testCount: number;
};

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  testCount,
}: DeleteFolderDialogProps) {
  const [deleteTestsToo, setDeleteTestsToo] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refresh } = useSidebar();

  useEffect(() => {
    if (!open) {
      setDeleteTestsToo(false);
    }
  }, [open]);

  const deleteMutation = useMutation({
    mutationFn: async (deleteTests: boolean) => {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteTests }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Failed to delete folder");
      }
      return data;
    },
    onSuccess: async () => {
      toast.success("Folder deleted");
      onOpenChange(false);
      await queryClient.refetchQueries({ queryKey: ["tests"], type: "all" });
      queryClient.removeQueries({ queryKey: ["folder", folderId] });
      refresh();
      router.push("/");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not delete folder. Try again.");
    },
  });

  const hasTests = testCount > 0;
  const switchId = "delete-folder-tests-switch";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[20px] border border-zinc-200/90 bg-white shadow-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="space-y-2 px-6 pt-6 pb-2 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-900">
            Delete this folder?
          </DialogTitle>
          <DialogDescription
            className={
              hasTests
                ? "sr-only"
                : "text-sm leading-relaxed text-zinc-600"
            }
          >
            {hasTests
              ? `Confirm deleting folder ${folderName} and choosing whether to delete its tests.`
              : "This folder has no tests."}
          </DialogDescription>
        </DialogHeader>

        {hasTests ? (
          <div className="px-6 py-5 space-y-3 border-t border-zinc-100 bg-zinc-50/40">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1 pr-2">
                <Label
                  htmlFor={switchId}
                  className="text-sm font-medium text-zinc-900 cursor-pointer"
                >
                  Also delete tests in this folder
                </Label>
                <p className="text-[13px] leading-snug text-zinc-500">
                  If you leave this switch off, your {testCount === 1 ? "test is not deleted" : `${testCount} tests are not deleted`}—only
                  the folder goes away, and {testCount === 1 ? "it still appears" : "they still appear"} in your sidebar. If you
                  turn the switch on, {testCount === 1 ? "that test is" : "those tests are"} deleted permanently as well.
                </p>
              </div>
              <Switch
                id={switchId}
                checked={deleteTestsToo}
                onCheckedChange={setDeleteTestsToo}
                className="shrink-0 mt-0.5"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-row justify-end gap-2 px-6 py-4 border-t border-zinc-100 bg-white">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-zinc-200"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate(hasTests ? deleteTestsToo : false)
            }
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
