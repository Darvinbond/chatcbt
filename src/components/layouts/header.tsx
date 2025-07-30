"use client";

"use client";

import Link from "next/link";
import { Plus, PanelRightClose, Copy } from "lucide-react";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { Sidebar } from "./sidebar";
import { useArtifact } from "@/components/providers/artifact-provider";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export function Header() {
  const { isOpen: isArtifactVisible } = useArtifact();
  const { testId } = useParams();

  const handleCopyLink = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/attempt?testId=${testId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  return (
    <header className="h-14 px-4 flex items-center justify-between bg-white sticky top-0 shrink-0">
      <div className="flex items-center gap-2">
        {isArtifactVisible ? (
          <>
            <Sidebar showOnlyTrigger triggerType="sheet" />
            <Link href="/" className="p-2 rounded-lg hover:bg-zinc-100">
              <Plus className="h-5 w-5" />
            </Link>
          </>
        ) : null}
        <h1 className="text-lg font-semibold">ChatCBT</h1>
      </div>
      {testId && (
        <button onClick={handleCopyLink} className="p-2 rounded-lg hover:bg-zinc-100">
          <Copy className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}
