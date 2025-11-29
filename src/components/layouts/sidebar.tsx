"use client";

import { useQuery } from "@tanstack/react-query";
import { Test, Folder as FolderModel } from "@/types/test";
import Link from "next/link";

interface SidebarData {
  folders: (FolderModel & { tests: Test[] })[];
  tests: Test[];
}
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelRightClose,
  Loader2,
  Brain,
  Folder,
  ChevronRight,
  ChevronDown,
  Circle,
  CircleDashed,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SearchModal } from "./search-modal";
import { UserMenu } from "./user-menu";
import { CreateFolderDialog } from "@/components/ui/create-folder-dialog";
import { ExportScoresModal } from "@/components/features/export/export-scores-modal";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { useArtifact } from "@/components/providers/artifact-provider";
import { useSidebar as useSidebarProvider } from "@/components/providers/sidebar-provider";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { FolderPlus } from "lucide-react";

async function fetchTests(): Promise<Test[]> {
  const response = await fetch("/api/tests/list");
  if (!response.ok) {
    throw new Error("Failed to fetch tests");
  }
  const data = await response.json();
  return data.data;
}

interface SidebarProps {
  showOnlyTrigger?: boolean;
  triggerType?: "default" | "sheet";
}

export function Sidebar({
  showOnlyTrigger = false,
  triggerType = "default",
}: SidebarProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useDashboard();
  const { isOpen: isArtifactVisible } = useArtifact();
  const { testId } = useParams();

  if (showOnlyTrigger) {
    if (triggerType === "sheet") {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-zinc-100">
              <PanelRightClose className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 h-screen p-[16px]">
            <SheetTitle className="sr-only">Sidebar</SheetTitle>
            <SidebarContent
              testId={testId as string}
              setIsSearchModalOpen={setIsSearchModalOpen}
              setIsCreateFolderOpen={setIsCreateFolderOpen}
              setIsExportModalOpen={setIsExportModalOpen}
            />
          </SheetContent>
        </Sheet>
      );
    }
    return null;
  }

  if (isArtifactVisible) {
    return null;
  }

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-screen p-4 bg-zinc-50d border-r transition-all duration-300",
          isSidebarCollapsed ? "w-20 px-0" : "w-64"
        )}
      >
        <SidebarContent
          testId={testId as string}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          setIsSearchModalOpen={setIsSearchModalOpen}
          setIsCreateFolderOpen={setIsCreateFolderOpen}
          setIsExportModalOpen={setIsExportModalOpen}
        />
      </aside>
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
      />
      <ExportScoresModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
}

export function SidebarContent({
  testId,
  isCollapsed,
  toggleSidebar,
  setIsSearchModalOpen,
  setIsCreateFolderOpen,
  setIsExportModalOpen,
}: {
  testId: string;
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
  setIsSearchModalOpen: (isOpen: boolean) => void;
  setIsCreateFolderOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
}) {
  const { refresh, isLoading, tests } = useSidebarProvider();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolderExpansion = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <div
        className={cn(
          "flex items-center !select-none mb-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <h2
            className="text-lg flex items-center justify-center gap-[8px] font-semibold cursor-pointer"
            onClick={() => refresh()}
          >
            <CircleDashed className="h-5 w-5" /> DBQuiz
          </h2>
        )}
        <button onClick={toggleSidebar}>
          {isCollapsed ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="mb-4 space-y-1">
        <Link href="/">
          <span
            className={cn(
              "w-full flex items-center gap-2 p-2 select-none rounded-lg cursor-pointer hover:bg-zinc-100",
              isCollapsed && "justify-center"
            )}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm">New Test</span>}
          </span>
        </Link>
        <button
          onClick={() => setIsCreateFolderOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 p-2 select-none rounded-lg cursor-pointer hover:bg-zinc-100",
            isCollapsed && "justify-center"
          )}
        >
          <Folder className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">New Folder</span>}
        </button>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 p-2 select-none rounded-lg cursor-pointer hover:bg-zinc-100",
            isCollapsed && "justify-center"
          )}
        >
          <Search className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">Search Tests</span>}
        </button>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 p-2 select-none rounded-lg cursor-pointer hover:bg-zinc-100",
            isCollapsed && "justify-center"
          )}
        >
          <Download className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">Export All Scores</span>}
        </button>
      </div>
      <div className="flex-1 dborder-t border-zinc-200/50 pt-[16px] overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <>
            <div className="w-full space-y-4 select-none">
              {/* Folders Section */}
              {tests?.folders && tests.folders.length > 0 && (
                <div>
                  <h4 className="text-sm text-zinc-500 mb-2 px-2 font-medium flex items-center justify-between">
                    Folders
                    {isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin text-black" />
                    )}
                  </h4>
                  <div className="">
                    {tests.folders.map((folder) => {
                      const isExpanded = expandedFolders.has(folder.id);
                      return (
                        <div key={folder.id}>
                          <div className="relative group w-full">
                            <Link
                              href={`/f/${folder.id}`}
                              className={cn(
                                "w-full py-2 px-2 rounded-lg whitespace-nowrap !truncate !text-ellipsis text-sm flex items-center gap-2",
                                "hover:bg-zinc-100"
                              )}
                            >
                              <Folder className="h-4 w-4 text-black flex-shrink-0" />
                              <span className="truncate text-black">
                                {folder.name}
                              </span>
                            </Link>
                            {folder.tests && folder.tests.length > 0 && (
                              <button
                                onClick={(e) =>
                                  toggleFolderExpansion(folder.id, e)
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-[24px] h-[24px] group-hover:bg-zinc-200 rounded-[6px] cursor-pointer flex items-center justify-center transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-zinc-500" />
                                )}
                              </button>
                            )}
                          </div>
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-200 ease-in-out",
                              isExpanded
                                ? "max-h-screen opacity-100"
                                : "max-h-0 opacity-0"
                            )}
                          >
                            <div className="ml-4 space-y-0">
                              {folder.tests?.map((test, index) => (
                                <Link
                                  key={test.id}
                                  className="w-full"
                                  href={`/t/${test.id}`}
                                >
                                  <span
                                    className={cn(
                                      "py-2 px-2 rounded-lg whitespace-nowrap !truncate !text-ellipsis text-sm w-full flex items-center gap-2",
                                      test.id === testId
                                        ? "bg-zinc-100"
                                        : "hover:bg-zinc-100"
                                    )}
                                  >
                                    <Brain className="h-4 w-4 text-black flex-shrink-0" />
                                    <span className="truncate">
                                      {test.title}
                                    </span>
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tests Section */}
              {tests?.tests && tests.tests.length > 0 && (
                <div>
                  <h4 className="text-sm text-zinc-500 mb-2 px-2 font-medium flex items-center justify-between">
                    Tests
                    {isLoading && (
                      <Loader2 className="h-3 w-3 animate-spin text-black" />
                    )}
                  </h4>
                  <div className="space-y-2">
                    {tests.tests.map((test) => (
                      <Link
                        key={test.id}
                        className="w-full"
                        href={`/t/${test.id}`}
                      >
                        <span
                          className={cn(
                            "py-2 px-2 rounded-lg whitespace-nowrap !truncate !text-ellipsis text-sm w-full flex items-center gap-2",
                            test.id === testId
                              ? "bg-zinc-100"
                              : "hover:bg-zinc-100"
                          )}
                        >
                          <Brain className="h-4 w-4 text-black flex-shrink-0" />
                          <span className="truncate">{test.title}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="pt-4 select-none mt-auto">
        <UserMenu isCollapsed={isCollapsed || false} />
      </div>
    </>
  );
}
