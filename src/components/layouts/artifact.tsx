"use client";

import { useArtifact } from "@/components/providers/artifact-provider";
import { X } from "lucide-react";
import React from "react";

export function Artifact() {
  const { isOpen, hide, content, title, actions, poolData, isLoadingIndex } = useArtifact();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white shadow-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={hide}
            className="p-1 cursor-pointer rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {actions.map((action, index) =>
            index === isLoadingIndex ? (
              React.cloneElement(action.trigger as React.ReactElement<any>, {
                key: index,
                isLoading: true,
                onClick: () => action.onClick(poolData),
              })
            ) : (
              React.cloneElement(action.trigger as React.ReactElement<any>, {
                key: index,
                isLoading: action.isLoading,
                onClick: () => action.onClick(poolData),
              })
            )
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </div>
  );
}
