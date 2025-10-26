"use client";

import { useArtifact } from "@/components/providers/artifact-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Test } from "@/types/test";
import { Button } from "@/components/ui/button";
import { DeleteTestModal } from "@/components/ui/delete-test-modal";
import { useState } from "react";

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

      <div className="border-t pt-4 mt-6">
        <h3 className="text-sm font-medium text-red-600 mb-2">Dangerous Actions</h3>
        <p className="text-xs text-gray-500 mb-3">
          These actions cannot be undone. Be careful.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
        >
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
