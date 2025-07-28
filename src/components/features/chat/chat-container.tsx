"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef, useEffect } from "react";

interface ChatContainerProps {
  children: ReactNode;
  isArtifactVisible: boolean;
  className?: string;
}

export function ChatContainer({ children, isArtifactVisible, className }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div
      className={cn(
        "mx-auto h-full flex flex-col transition-all duration-500 ease-in-out",
        !isArtifactVisible ? "w-2/3" : "w-full",
        className
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "flex-1 p-6 space-y-6 overflow-y-auto",
          isArtifactVisible && "!px-[56px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
