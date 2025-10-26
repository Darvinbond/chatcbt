"use client";

import { useQuery } from "@tanstack/react-query";
import { Test } from "@/types/test";
import Link from "next/link";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelRightClose,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SearchModal } from "./search-modal";
import { UserMenu } from "./user-menu";
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
  const { tests, isLoading, refresh } = useSidebarProvider();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useDashboard();
  const { isOpen: isArtifactVisible } = useArtifact();
  const { testId } = useParams();

  useEffect(() => {
    if (!isSidebarCollapsed) {
      refresh();
    }
  }, [isSidebarCollapsed]);

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
              tests={tests}
              isLoading={isLoading}
              testId={testId as string}
              setIsSearchModalOpen={setIsSearchModalOpen}
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
          tests={tests}
          isLoading={isLoading}
          testId={testId as string}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          setIsSearchModalOpen={setIsSearchModalOpen}
        />
      </aside>
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}

export function SidebarContent({
  tests,
  isLoading,
  testId,
  isCollapsed,
  toggleSidebar,
  setIsSearchModalOpen,
}: {
  tests: Test[] | undefined;
  isLoading: boolean;
  testId: string;
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
  setIsSearchModalOpen: (isOpen: boolean) => void;
}) {
  const { refresh } = useSidebarProvider();

  return (
    <>
      <div
        className={cn(
          "flex items-center mb-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <h2
            className="text-lg font-semibold cursor-pointer"
            onClick={() => refresh()}
          >
            Tests
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
      <div className="mb-4">
        <Link href="/">
          <span
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer",
              isCollapsed && "justify-center"
            )}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm">New Test</span>}
          </span>
        </Link>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className={cn(
            "w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer",
            isCollapsed && "justify-center"
          )}
        >
          <Search className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">Search Tests</span>}
        </button>
      </div>
      <div className="flex-1 border-t border-zinc-200/50 pt-[16px] overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <>
            <h3 className="text-sm text-zinc-500 mb-2 px-2 flex items-center justify-between">
              Tests
              {isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-black" />
              )}
            </h3>

            <div className="w-full">
              {tests?.map((test) => (
                <Link key={test.id} className="w-full" href={`/t/${test.id}`}>
                  <span
                    className={cn(
                      "py-2 px-2 rounded-[12px] whitespace-nowrap !line-clamp-1 !truncate !text-ellipsis !text-sm w-full",
                      test.id === testId ? "bg-zinc-100" : "hover:bg-zinc-100"
                    )}
                  >
                    {test.title}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="pt-4 mt-auto">
        <UserMenu isCollapsed={isCollapsed || false} />
      </div>
    </>
  );
}
