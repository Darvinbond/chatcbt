"use client";

import { useArtifact } from "@/components/providers/artifact-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={poolData?.title || ""}
          onChange={(e) => setPoolData({ ...poolData, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={poolData?.description || ""}
          onChange={(e) =>
            setPoolData({ ...poolData, description: e.target.value })
          }
        />
      </div>
      <div>
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          value={poolData?.duration || ""}
          onChange={(e) =>
            setPoolData({ ...poolData, duration: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="rounded-[20px] border bg-red-800/20 leading-none border-red-600 p-4 mt-6">
        <h3 className="text-[16px] font-medium text-red-700 mb-2">Dangerous Actions</h3>
        <p className="text-[14px] text-red-800 mb-3">
          These actions cannot be undone. Be careful.
        </p>
        <Button
          variant="destructive"
          // size="sm"
          className="rounded-full mt-[8px]"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <Trash className="h-4 w-4 emr-[8px]" />
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
