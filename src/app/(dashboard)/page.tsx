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
import { ChatMessages, Message } from "@/components/features/chat/chat-messages";
import { ChatContainer } from "@/components/features/chat/chat-container";

export default function DashboardPage() {
  const router = useRouter();
  const { isOpen: isArtifactVisible, show: showArtifact } = useArtifact();
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
    chatContainerRef.current?.scrollTo(
      0,
      chatContainerRef.current.scrollHeight
    );
  }, [messages]);

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
    mutationFn: async (data: { content: string; mode: string }) => {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Processing failed");
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.data?.questions) {
        const newQuestions = data.data.questions;
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

        addMessage(
          "system",
          <div className="space-y-2">
            <button
              onClick={openArtifact}
              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200 hover:bg-gray-50 transition-colors"
            >
              <BookText className="h-5 w-5" />
              <span className="font-medium text-sm">CBT Test Questions</span>
            </button>
            <p className="text-sm text-black">
              Here are the questions generated from your content. You can edit,
              reorder, or add new questions before proceeding.
            </p>
          </div>
        );

        addMessage(
          "system",
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
        );
      } else {
        toast.error("AI did not return valid questions.");
      }
    },
    onError: () => {
      toast.error("Failed to process content. Please try again.");
    },
  });

  const handlePromptSubmit = (value: string, mode: string) => {
    processMutation.mutate({ content: value, mode });
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

  const handleStudentsUploaded = (uploadedStudents: string[]) => {
    // Use ref to get current questions
    console.log(
      "handleStudentsUploaded called. Current questions:",
      questionsRef.current
    );
    setStudents(uploadedStudents);
    addMessage(
      "user-action",
      <p>{uploadedStudents.length} students uploaded.</p>
    );
    addMessage("system", <TestNameForm onSubmit={handleNameSubmit} />);
  };

  const handleNameSubmit = (name: string) => {
    // Use ref to get current questions
    console.log(
      "handleNameSubmit called. Current questions:",
      questionsRef.current
    );
    addMessage("user-action", <p>{name}</p>);
    addMessage(
      "system",
      <TestDescriptionForm onSubmit={handleDescriptionSubmit} />
    );
  };

  const handleDescriptionSubmit = (description: string) => {
    // Use ref to get current questions
    console.log(
      "handleDescriptionSubmit called. Current questions:",
      questionsRef.current
    );
    addMessage("user-action", <p>{description}</p>);
    addMessage("system", <TestDurationForm onSubmit={handleDurationSubmit} />);
  };

  const handleDurationSubmit = (duration: number) => {
    // Use ref to get current questions
    console.log(
      "handleDurationSubmit called. Current questions:",
      questionsRef.current
    );
    addMessage("user-action", <p>{duration} minutes</p>);

    const finalDetails = { name: "Untitled Test", description: "", duration };
    handleTestCreation(finalDetails);
  };

  const createTestMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      duration: number;
      questions: Question[];
      students: string[];
    }) => {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Test creation failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Test created successfully!");
      router.push(`/t/${data.data.id}`);
    },
    onError: () => {
      toast.error("Failed to create test. Please try again.");
    },
  });

  const handleTestCreation = async (details: {
    name: string;
    description: string;
    duration: number;
  }) => {
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
    });
  };

  return (
    <div className="h-max flex flex-col">
      <ChatContainer isArtifactVisible={isArtifactVisible}>
        {processMutation.isPending ? (
          <div className="flex items-center justify-center h-full">
            <AILoadingState taskSequences={generatingQuestions} />
          </div>
        ) : messages.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto text-center pt-20">
            <h1 className="text-4xl font-bold mb-8 text-black">
              EduTest Pro
            </h1>
            <p className="text-lg text-gray-600">
              Start by pasting text, or uploading a file to generate your
              test.
            </p>
          </div>
        ) : (
          <ChatMessages messages={messages} isArtifactVisible={isArtifactVisible} />
        )}
      </ChatContainer>
      <div className="sticky bottom-0 left-0 right-0 p-4">
        <div className="max-w-2xl mx-auto">
          <AIPrompt onSubmit={handlePromptSubmit} />
        </div>
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
