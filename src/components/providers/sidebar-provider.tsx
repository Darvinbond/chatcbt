"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Test } from "@/types/test";

async function fetchTests(): Promise<Test[]> {
  const response = await fetch("/api/tests/list");
  if (!response.ok) {
    throw new Error("Failed to fetch tests");
  }
  const data = await response.json();
  return data.data;
}

interface SidebarContextType {
  tests: Test[] | undefined;
  isLoading: boolean;
  refetch: () => void;
  refresh: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: tests, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
    enabled: false,
  });

  const refresh = () => {
    refetch();
  };

  return (
    <SidebarContext.Provider
      value={{
        tests,
        isLoading: isLoading || isFetching,
        refetch,
        refresh,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
