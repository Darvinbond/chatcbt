"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, X, BookText } from "lucide-react";
import AIPrompt from "@/components/kokonutui/ai-prompt";
import AILoadingState from "@/components/kokonutui/ai-loading";
import { Button } from "@/components/ui/button";
import { QuestionEditor } from "@/components/features/question-editor/question-editor";
import { StudentUpload } from "@/components/features/test-creation/student-upload";
import { TestNameForm } from "@/components/features/test-creation/test-name-form";
import { TestDescriptionForm } from "@/components/features/test-creation/test-description-form";
import { TestDurationForm } from "@/components/features/test-creation/test-duration-form";
import { Question, Student } from "@/types/test";
import { cn } from "@/lib/utils";
import { useArtifact } from "@/components/providers/artifact-provider";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  ChatMessages,
  Message,
} from "@/components/features/chat/chat-messages";
import { ChatContainer } from "@/components/features/chat/chat-container";

export default function DashboardPage() {
  const router = useRouter();
  const { isOpen: isArtifactVisible, show: showArtifact } = useArtifact();
  const { refresh } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add refs to store current values
  const questionsRef = useRef<Question[]>([]);
  const studentsRef = useRef<string[]>([]);

  // Update refs whenever state changes
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    if (isArtifactVisible) {
      const handleAddQuestion = () => {
        const newQuestion: Question = {
          id: uuidv4(),
          question: "New Question",
          options: [],
          type: "multiple-choice",
          points: 1,
        };
        setQuestions((prevQuestions) => [newQuestion, ...prevQuestions]);
      };

      showArtifact(
        <QuestionEditor />,
        "Generated Questions",
        [
          {
            onClick: handleAddQuestion,
            trigger: (
              <Button key="add" className="rounded-full" variant="outline">
                Add Question
              </Button>
            ),
          },
        ],
        { questions }
      );
    }
  }, [questions, isArtifactVisible, showArtifact]);

  const addMessage = (
    sender: "user" | "system" | "user-action",
    content: ReactNode
  ) => {
    setMessages((prev) => [...prev, { id: uuidv4(), sender, content }]);
  };

  const processMutation = useMutation({
    mutationFn: async (data: { content: string; mode: string; loadingMessageId: string }) => {
      const { loadingMessageId, ...rest } = data;
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!response.ok) throw new Error("Processing failed");
      const result = await response.json();
      return { ...result, loadingMessageId };
    },
    onSuccess: (data) => {
      const result = data;
      const loadingMessageId = result.loadingMessageId;

      if (result.data?.questions && result.data.questions.length > 0) {
        const newQuestions = result.data.questions;
        setQuestions(newQuestions);

        const openArtifact = () => {
          const handleAddQuestion = () => {
            const newQuestion: Question = {
              id: uuidv4(),
              question: "New Question",
              options: [],
              type: "multiple-choice",
              points: 1,
            };
            setQuestions((prevQuestions) => [newQuestion, ...prevQuestions]);
          };

          showArtifact(
            <QuestionEditor />,
            "Generated Questions",
            [
              {
                onClick: handleAddQuestion,
                trigger: (
                  <Button key="add" className="rounded-full" variant="outline">
                    Add Question
                  </Button>
                ),
              },
            ],
            { questions: newQuestions }
          );
        };

        // Replace loading message with response messages
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessageId).concat([
            {
              id: uuidv4(),
              sender: "system",
              content: (
                <div className="space-y-2">
                  <Button
                    onClick={openArtifact}
                    variant="secondary"
                    className="flex items-center gap-2 p-3 rounded-2xl"
                  >
                    <BookText className="h-5 w-5" />
                    <span className="font-medium text-sm">Click to view questions</span>
                  </Button>
                  <p className="text-sm text-black">
                    Here are the questions generated from your content. You can edit,
                    reorder, or add new questions before proceeding.
                  </p>
                </div>
              )
            },
            {
              id: uuidv4(),
              sender: "system",
              content: (
                <div className="flex justify-start items-center gap-2">
                  <Button
                    onClick={handleTryAgain}
                    variant="outline"
                    className="rounded-full"
                  >
                    Try Again
                  </Button>
                  <Button onClick={handleSaveQuestions} className="rounded-full">
                    Save & Continue
                  </Button>
                </div>
              )
            }
          ])
        );
      } else {
        // Replace loading message with error message
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessageId).concat({
            id: uuidv4(),
            sender: "system",
            content: "No questions could be generated from the content provided. Please try with different content or try again.",
          })
        );
      }
    },
    onError: (error, variables) => {
      const loadingMessageId = variables.loadingMessageId;
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId));
      toast.error("Failed to process content. Please try again.");
    },
  });

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    // Find the scrolling container by ID
    const scrollContainer = document.getElementById('dashboard-scroll-container') as HTMLElement;
    if (scrollContainer) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [messages, processMutation.isPending]);

  const handlePromptSubmit = (value: string, mode: string) => {
    console.log("Submitting prompt:", value, mode);
    // Add user message immediately so layout switches to chat view
    addMessage("user", value);
    // Add loading message
    const loadingMessage = {
      id: uuidv4(),
      sender: "system" as const,
      content: (
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      ),
    };
    setMessages((prev) => [...prev, loadingMessage]);
    processMutation.mutate({ content: value, mode, loadingMessageId: loadingMessage.id });
  };

  const handleTryAgain = () => {
    setMessages([]);
    setQuestions([]);
    setStudents([]);
  };

  const handleSaveQuestions = () => {
    // Use ref to get current questions
    console.log(
      "handleSaveQuestions called. Current questions:",
      questionsRef.current
    );
    addMessage("user-action", <p>Questions saved.</p>);
    addMessage(
      "system",
      <StudentUpload onStudentsUploaded={handleStudentsUploaded} />
    );
  };

  const handleStudentsUploaded = (uploadedStudents: string[], fileName: string) => {
    // Use ref to get current questions
    console.log(
      "handleStudentsUploaded called. Current questions:",
      questionsRef.current
    );
    setStudents(uploadedStudents);
    addMessage("user-action", <p>Uploaded {fileName}</p>);
    addMessage("system", <TestNameForm onSubmit={handleNameSubmit} />);
  };

  const handleNameSubmit = (name: string) => {
    console.log("🔥 QUESTO: handleNameSubmit called with:", name);
    addMessage("user-action", <p>{name}</p>);
    addMessage(
      "system",
      <TestDescriptionForm onSubmit={(description: string) => handleDescriptionSubmit(name, description)} />
    );
  };

  const handleDescriptionSubmit = (name: string, description: string) => {
    console.log("handleDescriptionSubmit called. Name:", name, "Description:", description);
    addMessage("user-action", <p>{description}</p>);
    addMessage("system", <TestDurationForm onSubmit={(duration: number) => handleDurationSubmit(name, description, duration)} />);
  };

  const handleDurationSubmit = (name: string, description: string, duration: number) => {
    console.log("handleDurationSubmit called. Name:", name, "Description:", description, "Duration:", duration);

    const finalDetails = { name, description, duration };
    handleTestCreation(finalDetails);
  };

  const createTestMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      duration: number;
      questions: Question[];
      students: string[];
      loadingMessageId: string;
    }) => {
      const { loadingMessageId, ...rest } = data;
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!response.ok) throw new Error("Test creation failed");
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Refresh sidebar tests immediately
      refresh();
      // Replace loading message with success message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== variables.loadingMessageId).concat({
          id: uuidv4(),
          sender: "system",
          content: "Test created successfully! Redirecting...",
        })
      );
      setTimeout(() => router.push(`/t/${data.data.id}`), 1000);
    },
    onError: (error, variables) => {
      // Replace loading message with error message and try again button
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== variables.loadingMessageId).concat({
          id: uuidv4(),
          sender: "system",
          content: (
            <div className="space-y-2">
              <p>Failed to create the test. Please try again.</p>
              <Button
                variant="default"
                className="rounded-full"
                onClick={() => retryCreateTest(variables)}
              >
                Try Again
              </Button>
            </div>
          ),
        })
      );
    },
  });

  const retryCreateTest = (details: any) => {
    // Add new loading message and retry
    const loadingMessage = {
      id: uuidv4(),
      sender: "system" as const,
      content: (
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      ),
    };
    setMessages((prev) => [...prev, loadingMessage]);
    const finalQuestions = questionsRef.current;
    const finalStudents = studentsRef.current;
    createTestMutation.mutate({
      title: details.title,
      description: details.description,
      duration: details.duration,
      questions: finalQuestions,
      students: finalStudents,
      loadingMessageId: loadingMessage.id,
    });
  };

  const handleTestCreation = async (details: {
    name: string;
    description: string;
    duration: number;
  }) => {
    // Add loading message
    const loadingMessage = {
      id: uuidv4(),
      sender: "system" as const,
      content: (
        <div className="animate-pulse">
          <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      ),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // Use refs to get current values
    const finalQuestions = questionsRef.current;
    const finalStudents = studentsRef.current;

    console.log("handleTestCreation called. Final payload:", {
      title: details.name,
      description: details.description,
      duration: details.duration,
      questions: finalQuestions,
      students: finalStudents,
    });

    createTestMutation.mutate({
      title: details.name,
      description: details.description,
      duration: details.duration,
      questions: finalQuestions,
      students: finalStudents,
      loadingMessageId: loadingMessage.id,
    });
  };

  return (
    <div className={cn("h-full relative")}>
      <div
        className={cn(
          "h-full flex flex-col relative",
          // When no messages, center the header + input together
          messages.length === 0 && "justify-center"
        )}
      >
        {messages.length > 0 && (
          <>
            {/* Top content area - takes remaining height, scrolls internally */}
            <div className="flex-1 h-max">
              <ChatContainer isArtifactVisible={isArtifactVisible}>
                <ChatMessages
                  messages={messages}
                  isArtifactVisible={isArtifactVisible}
                />
              </ChatContainer>
            </div>

            {/* Input area - sticky at bottom when there are messages */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-background">
              <div className="max-w-2xl mx-auto w-full">
                <AIPrompt onSubmit={handlePromptSubmit} showHeader={false} />
              </div>
            </div>
          </>
        )}

        {/* Input area - centered with header when no messages */}
        {messages.length === 0 && (
          <div className="p-4">
            <div className="max-w-2xl mx-auto w-full">
              <AIPrompt onSubmit={handlePromptSubmit} showHeader={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const generatingQuestions = [
  {
    status: "Generating questions",
    lines: [
      "Parsing your content...",
      "Identifying key concepts...",
      "Formulating questions...",
      "Generating answer options...",
      "Finalizing test structure...",
    ],
  },
];
