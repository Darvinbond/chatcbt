"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import AIPrompt from "@/components/kokonutui/ai-prompt";
import AILoadingState from "@/components/kokonutui/ai-loading";
import { Message } from "@/components/features/chat/chat-messages";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation } from "@tanstack/react-query";
import { Folder, Test } from "@/types/test";

interface TestCreationWrapperProps {
  content: React.ReactNode;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  folderId?: string;
  folder?: Folder & { tests: Test[] };
  onTestDeleted?: (testId: string) => void;
  placeholder?: string;
}

export function TestCreationWrapper({
  content,
  messages,
  setMessages,
  folderId,
  folder,
  onTestDeleted,
  placeholder,
}: TestCreationWrapperProps) {
  const queryClient = useQueryClient();
  const messageId = useRef(uuidv4());

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await fetch(`/api/tests/${testId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete test");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Test deleted successfully");
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: () => {
      toast.error("Failed to delete test. Please try again.");
    },
  });

  const handlePromptSubmit = (prompt: string, mode: string) => {
    const userMessage = {
      id: uuidv4(),
      sender: "user" as const,
      content: prompt,
    };
    const loadingMessage = {
      id: uuidv4(),
      sender: "system-llm-response" as const,
      fullWidth: true,
      content: (
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      ),
    };
    const newMessages = [...messages, userMessage, loadingMessage];
    setMessages(newMessages);

    // Hide content when creating test
    setMessages([
      {
        id: messageId.current,
        sender: "system",
        fullWidth: true,
        content: folderId ? (
          <div className="py-12 text-center">
            <AILoadingState taskSequences={[]} />
            <p className="text-zinc-600 mt-4">Creating your test...</p>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AILoadingState taskSequences={[]} />
            <p className="text-zinc-600 mt-4">Creating your test...</p>
          </div>
        ),
      },
      userMessage,
      loadingMessage,
    ]);

    const testData = {
      title: prompt.slice(0, 50), // Use first 50 chars as title
      description: prompt.length > 50 ? prompt : undefined,
      duration: 60, // Default 60 minutes
      questions: [],
      ...(folderId && { folderId }),
    };

    // Immediately create the test
    fetch("/api/tests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    }).then(async (response) => {
      if (response.ok) {
        const result = await response.json();
        const newTest = result.data;

        // Update loading message to success and add created test
        if (folderId && folder) {
          setMessages([
            {
              id: messageId.current,
              sender: "system",
              fullWidth: true,
              content: (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <Link href="/">
                      <Button variant="ghost" size="sm" className="p-2">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                    <h1 className="text-xl font-semibold">{folder.name}</h1>
                  </div>

                  {/* Newly created test */}
                  <div className="p-4 border border-zinc-200 rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/t/${newTest.id}`}>
                          <h3 className="font-medium text-green-800 hover:text-green-900 transition-colors cursor-pointer">
                            {newTest.title}
                          </h3>
                        </Link>
                        {newTest.description && (
                          <p className="text-sm text-green-700 mt-1">{newTest.description}</p>
                        )}
                        <p className="text-xs text-green-600 mt-2">✅ Just created</p>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteTestMutation.mutate(newTest.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Test
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {(folder.tests && folder.tests.length > 0) && (
                    <div className="grid gap-3">
                      <p className="text-sm text-zinc-500">Other tests in this folder:</p>
                      {folder.tests.map((test) => (
                        <div
                          key={test.id}
                          className="p-4 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/t/${test.id}`}>
                                <h3 className="font-medium text-black hover:text-blue-600 transition-colors cursor-pointer">
                                  {test.title}
                                </h3>
                              </Link>
                              {test.description && (
                                <p className="text-sm text-zinc-600 mt-1">{test.description}</p>
                              )}
                            </div>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => deleteTestMutation.mutate(test.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Test
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!folder.tests || folder.tests.length === 0) && (
                    <div className="text-center py-8 text-zinc-500">
                      <p>Keep creating more tests!</p>
                      <p className="text-sm mt-1">Use the AI prompt below.</p>
                    </div>
                  )}
                </div>
              ),
            },
            userMessage,
            {
              id: loadingMessage.id,
              sender: "system-llm-response",
              fullWidth: true,
              content: (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">✅ Test created successfully: "{newTest.title}"</p>
                </div>
              ),
            },
          ]);
        } else {
          // For main page, show simple success
          setMessages([
            {
              id: messageId.current,
              sender: "system",
              fullWidth: true,
              content: content,
            },
            userMessage,
            {
              id: loadingMessage.id,
              sender: "system-llm-response",
              fullWidth: true,
              content: (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">✅ Test created successfully: "{newTest.title}"</p>
                </div>
              ),
            },
          ]);
        }

        // Refresh data
        if (folderId) {
          queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
        }
        queryClient.invalidateQueries({ queryKey: ["tests"] });
      } else {
        // Handle error
        setMessages([
          {
            id: messageId.current,
            sender: "system",
            fullWidth: true,
            content: content,
          },
          userMessage,
          {
            id: loadingMessage.id,
            sender: "system-llm-response",
            fullWidth: true,
            content: (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{folderId ? "Failed to create test in folder" : "Failed to create test"}. Please try again.</p>
              </div>
            ),
          },
        ]);
      }
    }).catch((error) => {
      console.error("Error creating test:", error);
      setMessages([
        {
          id: messageId.current,
          sender: "system",
          fullWidth: true,
          content: content,
        },
        userMessage,
        {
          id: loadingMessage.id,
          sender: "system-llm-response",
          fullWidth: true,
          content: (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{folderId ? "Error creating test in folder" : "Error creating test"}. Please try again.</p>
            </div>
          ),
        },
      ]);
    });
  };

  return (
    <AIPrompt
      placeholder={folderId && folder ? `Create a test for "${folder.name}" folder` : placeholder || "Create a new test"}
      onSubmit={handlePromptSubmit}
      hideBottomTools
    />
  );
}
