"use client";

import { useQuery } from "@tanstack/react-query";
import { Test } from "@/types/test";
import Link from "next/link";
import { Plus, Search, PanelLeftClose, PanelRightClose } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { SearchModal } from "./search-modal";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/providers/dashboard-provider";
import { useArtifact } from "@/components/providers/artifact-provider";
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
  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
          "flex flex-col h-screen p-4 bg-zinc-50 border-r transition-all duration-300",
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
  return (
    <>
      <div className={cn("flex items-center mb-4", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <h2 className="text-lg font-semibold">Tests</h2>}
        <button onClick={toggleSidebar}>
          {isCollapsed ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
        <div className="mb-4">
          <Link href="/">
            <span className={cn("w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer", isCollapsed && "justify-center")}>
              <Plus className="h-5 w-5" />
              {!isCollapsed && <span className="text-sm">New Test</span>}
            </span>
          </Link>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className={cn("w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer", isCollapsed && "justify-center")}
          >
          <Search className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm">Search Tests</span>}
        </button>
      </div>
      <div className="flex-1 border-y border-zinc-200/50 pt-[16px] overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <>
            <h3 className="text-sm text-zinc-500 mb-2 px-2">Tests</h3>
            {!isLoading && (
              <ul>
                {tests?.map((test) => (
                  <li key={test.id}>
                    <Link href={`/t/${test.id}`}>
                      <span
                        className={cn(
                          "block py-2 px-2 rounded-lg text-sm",
                          test.id === testId
                            ? "bg-zinc-200"
                            : "hover:bg-zinc-200"
                        )}
                      >
                        {test.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <div className="pt-4 mt-auto">
        <UserMenu isCollapsed={isCollapsed || false} />
      </div>
    </>
  );
}
