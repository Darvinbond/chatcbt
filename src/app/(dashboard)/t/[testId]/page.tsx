"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Test, Student } from "@/types/test";
import { QuestionEditor } from "@/components/features/question-editor/question-editor";
import AILoadingState from "@/components/kokonutui/ai-loading";
import {
  ChatMessages,
  Message,
} from "@/components/features/chat/chat-messages";
import { useArtifact } from "@/components/providers/artifact-provider";
import { useEffect, useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { BookText, User, Settings, History } from "lucide-react";
import { ChatContainer } from "@/components/features/chat/chat-container";
import { Button } from "@/components/ui/button";
import { StudentsArtifact } from "@/components/artifacts/students-artifact";
import { AttemptsArtifact } from "@/components/artifacts/attempts-artifact";
import { toast } from "sonner";
import AIPrompt from "@/components/kokonutui/ai-prompt";

async function fetchTest(testId: string): Promise<Test> {
  const response = await fetch(`/api/tests/${testId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch test");
  }
  const data = await response.json();
  return data.data;
}

export default function TestDetailsPage() {
  const { testId } = useParams();
  const {
    isOpen: isArtifactVisible,
    show: showArtifact,
    hide: hideArtifact,
    poolData,
    setPoolData,
  } = useArtifact();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesInitialized = useRef(false);
  const { data: test, isLoading } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => fetchTest(testId as string),
    enabled: !!testId,
  });

  const saveStudentsMutation = useMutation({
    mutationFn: async (data: {
      testId: string;
      students: Student[];
      deletedStudentIds?: string[];
    }) => {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save students");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      hideArtifact();
    },
    onError: () => {
      toast.error("Failed to save students. Please try again.");
    },
  });

  const saveQuestionsMutation = useMutation({
    mutationFn: async (data: {
      testId: string;
      questions: any[];
      updatedQuestions: any[];
      deletedQuestionIds?: string[];
    }) => {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save questions");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      hideArtifact();
    },
    onError: () => {
      toast.error("Failed to save questions. Please try again.");
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (data: { query: string; history: Message[] }) => {
      const response = await fetch(`/api/tests/${testId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to get chat response");
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          sender: "system-llm-response",
          fullWidth: true,
          content: data.data.response,
        },
      ]);
    },
    onError: () => {
      toast.error("Failed to get chat response. Please try again.");
    },
  });

  // Memoize the callback functions to ensure stable references
  const openQuestionsArtifact = useCallback(() => {
    if (!test) return;

    const handleAddQuestion = () => {
      const newQuestion = {
        id: uuidv4(),
        question: "New Question",
        options: [],
        type: "multiple-choice",
        points: 1,
      };
      setPoolData((prevPoolData: any) => ({
        ...prevPoolData,
        questions: [newQuestion, ...(prevPoolData.questions || [])],
      }));
    };

    const handleSave = (poolData: any) => {
      const { questions, deletedQuestionIds } = poolData || {};
      const initialQuestions = test?.questions || [];

      console.log("questions", questions);
      console.log("initialQuestions", initialQuestions);

      const newQuestions = questions.filter(
        (q: any) => !initialQuestions.find((iq: any) => iq.id === q.id)
      );

      const updatedQuestions = questions.filter((q: any) => {
        const initialQuestion = initialQuestions.find(
          (iq: any) => iq.id === q.id
        );
        
        if (!initialQuestion) return true; // New question
        
        const sameQuestion = q.question === initialQuestion.question;
        const sameOptions = q.options.length === initialQuestion.options.length &&
          q.options.every((o: any, index: number) => {
            const io = initialQuestion.options[index];
            return io && io.id === o.id && io.text === o.text;
          });
        
        return !(sameQuestion && sameOptions); // Return true if something changed
      });

      saveQuestionsMutation.mutate({
        testId: testId as string,
        questions: newQuestions.map(({ id, ...rest }: any) => rest),
        updatedQuestions,
        deletedQuestionIds,
      });
    };

    showArtifact(
      <QuestionEditor />,
      "Questions",
      [
        {
          onClick: handleAddQuestion,
          trigger: (
            <Button key="add" className="rounded-full" variant="outline">
              Add Question
            </Button>
          ),
        },
        {
          onClick: handleSave,
          trigger: (
            <Button key="save" className="rounded-full">
              Save Changes
            </Button>
          ),
        },
      ],
      {
        questions: test.questions || [],
      }
    );
  }, [
    test,
    showArtifact,
    poolData,
    setPoolData,
    saveQuestionsMutation,
    testId,
  ]);

  const openStudentsArtifact = useCallback(() => {
    if (!test) return;

    const handleAddStudent = (poolData: any) => {
      const newStudent: Student = {
        id: uuidv4(),
        name: "New Student",
      };
      const newStudents = [newStudent, ...(poolData.students || [])];
      setPoolData({ ...poolData, students: newStudents });
    };

    const handleSave = (poolData: any) => {
      const { students, deletedStudentIds } = poolData || {};
      const newStudents = students.filter(
        (student: Student) => !test.students?.find((s) => s.id === student.id)
      );
      const updatedStudents = students.filter((student: Student) => {
        const originalStudent = test.students?.find(
          (s: Student) => s.id === student.id
        );
        return originalStudent && originalStudent.name !== student.name;
      });
      saveStudentsMutation.mutate({
        testId: testId as string,
        students: [
          ...newStudents.map((s: Student) => ({ name: s.name })),
          ...updatedStudents.map((s: Student) => ({
            name: s.name,
            id: s.id,
          })),
        ],
        deletedStudentIds,
      });
    };

    showArtifact(
      <StudentsArtifact testId={testId as string} />,
      "Students",
      [
        {
          onClick: handleAddStudent,
          trigger: (
            <Button key="add" className="rounded-full" variant="outline">
              Add Candidate
            </Button>
          ),
        },
        {
          onClick: handleSave,
          trigger: (
            <Button key="save" className="rounded-full">
              Save Changes
            </Button>
          ),
        },
      ],
      {
        students: test.students || [],
      }
    );
  }, [test, testId, showArtifact, setPoolData, saveStudentsMutation]);

  const openAttemptsArtifact = useCallback(() => {
    if (!test) return;

    showArtifact(
      <AttemptsArtifact attempts={test.attempts || []} test={test} />,
      "Attempts",
      []
    );
  }, [test, showArtifact]);

  const openSettingsArtifact = useCallback(() => {
    if (!test) return;

    showArtifact(
      <div>
        <h2 className="text-xl font-bold mb-4">Test Settings</h2>
        <p>Duration: {test.duration} minutes</p>
      </div>,
      "Test Settings",
      [
        {
          onClick: () => {},
          trigger: (
            <Button key="save" className="rounded-full">
              Save Changes
            </Button>
          ),
        },
      ]
    );
  }, [test, showArtifact]);

  useEffect(() => {
    // Only initialize messages once when test is loaded
    if (test && !messagesInitialized.current) {
      messagesInitialized.current = true;
      setMessages([
        {
          id: uuidv4(),
          sender: "system",
          fullWidth: true,
          content: (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={openQuestionsArtifact}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200 hover:bg-gray-50 transition-colors min-w-[240px] cursor-pointer"
              >
                <BookText className="h-5 w-5" />
                <div className="text-left">
                  <span className="font-medium text-sm text-black">
                    Questions
                  </span>
                  <p className="text-xs text-zinc-500">
                    {test.questions.length} Questions
                  </p>
                </div>
              </button>
              <button
                onClick={openStudentsArtifact}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200 hover:bg-gray-50 transition-colors min-w-[240px] cursor-pointer"
              >
                <User className="h-5 w-5" />
                <div className="text-left">
                  <span className="font-medium text-sm text-black">
                    Students
                  </span>
                  <p className="text-xs text-zinc-500">
                    {test.students?.length || 0} Students
                  </p>
                </div>
              </button>
              <button
                onClick={openSettingsArtifact}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200 hover:bg-gray-50 transition-colors min-w-[240px] cursor-pointer"
              >
                <Settings className="h-5 w-5" />
                <div className="text-left">
                  <span className="font-medium text-sm text-black">
                    Test Settings
                  </span>
                  <p className="text-xs text-zinc-500">
                    {test.duration} minutes test
                  </p>
                </div>
              </button>
              <button
                onClick={openAttemptsArtifact}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200 hover:bg-gray-50 transition-colors min-w-[240px] cursor-pointer"
              >
                <History className="h-5 w-5" />
                <div className="text-left">
                  <span className="font-medium text-sm text-black">
                    Attempts
                  </span>
                  <p className="text-xs text-zinc-500">
                    {test.attempts?.length || 0} Attempts
                  </p>
                </div>
              </button>
            </div>
          ),
        },
      ]);
    }
  }, [test, openQuestionsArtifact, openStudentsArtifact, openSettingsArtifact, openAttemptsArtifact]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <AILoadingState taskSequences={fetchingTest} />
      </div>
    );
  }

  if (!test) {
    return <div>Test not found</div>;
  }

  const handlePromptSubmit = (query: string) => {
    const newMessages: Message[] = [
      ...messages,
      {
        id: uuidv4(),
        sender: "user",
        content: query,
      },
    ];
    setMessages(newMessages);
    const history = newMessages.filter(
      (msg) => msg.sender === "user" || msg.sender === "system-llm-response"
    );
    chatMutation.mutate({ query, history });
  };

  return (
    <div className="h-full flex flex-col">
      <ChatContainer isArtifactVisible={isArtifactVisible}>
        <ChatMessages
          messages={messages}
          isArtifactVisible={isArtifactVisible}
        />
      </ChatContainer>
      <div className="sticky bottom-0 left-0 right-0 p-4">
        <div className="max-w-2xl mx-auto">
          <AIPrompt
            placeholder="Ask about the test"
            onSubmit={handlePromptSubmit}
            hideBottomTools
          />
        </div>
      </div>
    </div>
  );
}

const fetchingTest = [
  {
    status: "Fetching test",
    lines: [
      "Connecting to the database...",
      "Querying for the test...",
      "Fetching questions...",
      "Fetching student data...",
      "Finalizing test...",
    ],
  },
];
