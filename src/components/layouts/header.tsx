"use client";

import Link from "next/link";
import { Plus, PanelRightClose } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { Sidebar } from "./sidebar";
import { useArtifact } from "@/components/providers/artifact-provider";

export function Header() {
  const { isOpen: isArtifactVisible } = useArtifact();

  return (
    <header className="h-14 px-4 flex items-center bg-white sticky top-0 shrink-0">
      {isArtifactVisible ? (
        <div className="flex items-center gap-2">
          <Sidebar showOnlyTrigger triggerType="sheet" />
          <Link href="/" className="p-2 rounded-lg hover:bg-zinc-100">
            <Plus className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">ChatCBT</h1>
        </div>
      ) : (
        <h1 className="text-lg font-semibold">ChatCBT</h1>
      )}
    </header>
  );
}
