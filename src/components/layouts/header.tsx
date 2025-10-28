"use client";

"use client";

import Link from "next/link";
import { Plus, PanelRightClose, Copy, ExternalLink } from "lucide-react";
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

  const handleOpenInNewWindow = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/attempt?testId=${testId}`;
    window.open(link, '_blank');
  };

  return (
    <header className="h-14 z-50 px-4 flex items-center justify-between dbg-white sticky top-0 shrink-0">
      <div className="flex items-center gap-2">
        {isArtifactVisible ? (
          <>
            <Sidebar showOnlyTrigger triggerType="sheet" />
            <Link href="/" className="p-2 rounded-lg hover:bg-zinc-100">
              <Plus className="h-5 w-5" />
            </Link>
          </>
        ) : null}

        <div className="flex items-center justify-center h-64">
          <div className="size-[20px] bg-black rounded-full eanimate-pulse" />
        </div>
      </div>
      {testId && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLink}
            className="p-2 cursor-pointer rounded-lg hover:bg-zinc-100"
            title="Copy test link"
          >
            <Copy className="h-5 w-5" />
          </button>
          <button
            onClick={handleOpenInNewWindow}
            className="p-2 cursor-pointer rounded-lg hover:bg-zinc-100"
            title="Open test in new tab"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
}
