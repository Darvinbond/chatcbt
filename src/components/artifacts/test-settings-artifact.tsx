"use client";

import { useArtifact } from "@/components/providers/artifact-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Test } from "@/types/test";
import { Button } from "@/components/ui/button";
import { DeleteTestModal } from "@/components/ui/delete-test-modal";
import { useState } from "react";
import { Trash } from "lucide-react";

interface TestSettingsArtifactProps {
  test: Test;
}

export function TestSettingsArtifact({ test }: TestSettingsArtifactProps) {
  const { poolData, setPoolData } = useArtifact();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const autoMark = poolData?.autoMarkOnSubmit ?? true;

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="settings-title" className="text-zinc-700">
            Title
          </Label>
          <Input
            id="settings-title"
            value={poolData?.title || ""}
            onChange={(e) => setPoolData({ ...poolData, title: e.target.value })}
            className="rounded-xl border-zinc-200/80 bg-white transition-shadow focus-visible:ring-zinc-300"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-description" className="text-zinc-700">
            Description
          </Label>
          <Textarea
            id="settings-description"
            value={poolData?.description || ""}
            onChange={(e) =>
              setPoolData({ ...poolData, description: e.target.value })
            }
            className="rounded-xl border-zinc-200/80 bg-white min-h-[88px] transition-shadow focus-visible:ring-zinc-300 resize-y"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-duration" className="text-zinc-700">
            Duration (minutes)
          </Label>
          <Input
            id="settings-duration"
            type="number"
            value={poolData?.duration || ""}
            onChange={(e) =>
              setPoolData({ ...poolData, duration: parseInt(e.target.value) })
            }
            className="rounded-xl border-zinc-200/80 bg-white transition-shadow focus-visible:ring-zinc-300 max-w-[11rem]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50/80 px-4 py-3.5">
        <div className="min-w-0 space-y-1 pr-2">
          <Label
            htmlFor="autoMarkOnSubmit"
            className="cursor-pointer text-sm font-medium text-zinc-900"
          >
            Mark on submit
          </Label>
          <p className="text-[13px] leading-snug text-zinc-500">
            {autoMark
              ? "Scores are calculated as soon as a student submits."
              : "Submissions are stored only; open Attempts and run Mark test when you’re ready."}
          </p>
        </div>
        <Switch
          id="autoMarkOnSubmit"
          checked={autoMark}
          onCheckedChange={(checked) =>
            setPoolData({ ...poolData, autoMarkOnSubmit: checked })
          }
          className="shrink-0"
        />
      </div>

      <div className="rounded-[20px] border bg-red-800/20 leading-none border-red-600 p-4">
        <h3 className="text-[16px] font-medium text-red-700 mb-2">
          Dangerous Actions
        </h3>
        <p className="text-[14px] text-red-800 mb-3">
          These actions cannot be undone. Be careful.
        </p>
        <Button
          variant="destructive"
          className="rounded-full mt-[8px]"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <Trash className="h-4 w-4" />
          Delete Test
        </Button>
      </div>

      <DeleteTestModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        test={test}
      />
    </div>
  );
}
