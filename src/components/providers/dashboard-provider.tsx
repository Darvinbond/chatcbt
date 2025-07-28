"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useArtifact, Action } from "@/components/providers/artifact-provider";

interface DashboardContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  showArtifact: (content: ReactNode, title: string, actions: Action[]) => void;
  hideArtifact: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { show, hide, isOpen } = useArtifact();

  useEffect(() => {
    if (isOpen) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const showArtifact = useCallback(
    (content: ReactNode, title: string, actions: Action[]) => {
      show(content, title, actions);
    },
    [show]
  );

  const hideArtifact = useCallback(() => {
    hide();
    setIsSidebarCollapsed(false);
  }, [hide]);

  return (
    <DashboardContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar,
        showArtifact,
        hideArtifact,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
