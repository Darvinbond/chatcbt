"use client";

import { useArtifact } from "@/components/providers/artifact-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Test } from "@/types/test";

interface TestSettingsArtifactProps {
  test: Test;
}

export function TestSettingsArtifact({ test }: TestSettingsArtifactProps) {
  const { poolData, setPoolData } = useArtifact();

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
    </div>
  );
}
