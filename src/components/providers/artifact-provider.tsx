"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";

export interface Action {
  onClick: (poolData: any) => void;
  trigger: ReactNode;
  isLoading?: boolean;
}

interface ArtifactContextType {
  isOpen: boolean;
  content: ReactNode;
  title: string;
  actions: Action[];
  poolData: any;
  setPoolData: (data: any) => void;
  isLoadingIndex: number | null;
  setIsLoadingIndex: (idx: number | null) => void;
  show: (
    content: ReactNode,
    title: string,
    actions: Action[],
    poolData?: any
  ) => void;
  hide: () => void;
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(
  undefined
);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [title, setTitle] = useState("");
  const [actions, setActions] = useState<Action[]>([]);
  const [poolData, setPoolData] = useState<any>(null);
  const [isLoadingIndex, setIsLoadingIndex] = useState<number | null>(null);

  const setPoolDataCallback = useCallback((data: any) => {
    setPoolData(data);
  }, []);

  const show = useCallback(
    (
      newContent: ReactNode,
      newTitle: string,
      newActions: Action[],
      newPoolData?: any
    ) => {
      setPoolData(newPoolData);
      setContent(newContent);
      setTitle(newTitle);
      setActions(newActions);
      setIsOpen(true);
    },
    []
  );

  const hide = useCallback(() => {
    setIsOpen(false);
    setContent(null);
    setTitle("");
    setActions([]);
    setPoolData(null);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    hide();
  }, [pathname, hide]);

  return (
    <ArtifactContext.Provider
      value={{
        isOpen,
        content,
        title,
        actions,
        poolData,
        setPoolData: setPoolDataCallback,
        isLoadingIndex,
        setIsLoadingIndex,
        show,
        hide,
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error("useArtifact must be used within an ArtifactProvider");
  }
  return context;
}
