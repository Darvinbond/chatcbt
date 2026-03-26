"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Test, Folder } from "@/types/test";
import { FullTestCreationFlow } from "@/components/features/test-creation/full-test-creation-flow";
import Link from "next/link";
import { Folder as FolderIcon } from "lucide-react";
import { useState } from "react";
import { DeleteFolderDialog } from "@/components/ui/delete-folder-dialog";

async function fetchFolder(folderId: string): Promise<Folder & { tests: Test[] }> {
  const response = await fetch(`/api/folders/${folderId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch folder");
  }
  const data = await response.json();
  return data.data;
}

export default function FolderDetailsPage() {
  const { folderId } = useParams();
  const { data: folder, isLoading } = useQuery({
    queryKey: ["folder", folderId],
    queryFn: () => fetchFolder(folderId as string),
    enabled: !!folderId,
  });

  const [isChatMode, setIsChatMode] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      </div>
    );
  }

  if (!folder) {
    return <div>Folder not found</div>;
  }

  return (
    <div className="h-full flex flex-col justify-start">
      <DeleteFolderDialog
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        folderId={folder.id}
        folderName={folder.name}
        testCount={folder.tests?.length ?? 0}
      />

      <div className="w-full max-w-2xl mx-auto">
        <FullTestCreationFlow
          folderId={folderId as string}
          placeholder="Describe your test"
          topTitle={
            <div className="flex flex-col items-center gap-2">
              <span className="flex items-center justify-center gap-2 text-2xl font-semibold leading-snug tracking-tight text-zinc-900">
                <FolderIcon className="h-6 w-6 shrink-0 text-zinc-800" />
                {folder.name}
              </span>
              <button
                type="button"
                onClick={() => setDeleteFolderOpen(true)}
                className="text-[13px] font-medium text-zinc-400 hover:text-zinc-600 underline-offset-[5px] decoration-zinc-300/80 underline hover:decoration-zinc-500 transition-colors"
              >
                Delete folder
              </button>
            </div>
          }
          onModeChange={setIsChatMode}
        />
      </div>

      {/* Tests list below - only show when not in chat mode */}
      {folder.tests && folder.tests.length > 0 && !isChatMode && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-6 py-4">
            <div className="space-y-0">
              {folder.tests.map((test, index) => (
                <div key={test.id}>
                  <Link href={`/t/${test.id}`}>
                    <div className="px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                      <h4 className="font-medium text-black">
                        {test.title}
                      </h4>
                      {test.description && (
                        <p className="text-sm text-zinc-600 mt-1">{test.description}</p>
                      )}
                    </div>
                  </Link>
                  {index < folder.tests!.length - 1 && (
                    <div className="border-b border-zinc-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
