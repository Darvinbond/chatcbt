"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TestDetailsModal } from "@/components/features/attempt/test-details-modal";
import { Test, Student } from "@/types/test";
import { TestProvider, useTestContext } from "@/components/providers/test-provider";
import { AttemptUI } from "@/components/features/attempt/attempt-ui";
import { testService } from "@/services/test.service";

function Attempt() {
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const [studentCode, setStudentCode] = useState("");
  const [testExists, setTestExists] = useState<boolean | null>(null);
  const { setTest, setStudent, test, student, setQuestions } = useTestContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);

  useEffect(() => {
    if (testId) {
      fetch("/api/tests/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            setTestExists(false);
          }
        })
        .then((data) => {
          if (data) {
            setTest(data.data);
            setTestExists(true);
          }
        })
        .catch(() => {
          setTestExists(false);
        });
    }
  }, [testId, setTest]);

  const handleStartTest = async () => {
    if (studentCode.trim() === "") {
      toast.error("Please enter your student code");
      return;
    }

    try {
      const studentResponse = await fetch("/api/students/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, studentCode }),
      });

      if (!studentResponse.ok) {
        throw new Error("Invalid student code");
      }

      const studentData = await studentResponse.json();
      setStudent(studentData.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Invalid student code");
    }
  };

  if (testExists === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!testExists) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Test not found</p>
      </div>
    );
  }

  if (isTestStarted) {
    return <AttemptUI />;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-center">
            {test?.title}
          </h1>
          <p className="text-zinc-300 text-[14px] text-center">
            {test?.description}
          </p>
          <div className="mt-8">
            <Input
              type="text"
              placeholder="Enter your code"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              className="w-full"
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleStartTest}
                className="w-max rounded-full"
              >
                Start Test
              </Button>
            </div>
          </div>
        </div>
      </div>
      {test && student && (
        <TestDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStartTest={async () => {
            if (test && student && student.id) {
              try {
                const response = await testService.attemptTest(test.id, student.id);
                // console.log(response)
                setQuestions((response.data as any).questions);
                setIsModalOpen(false);
                setIsTestStarted(true);
              } catch (error) {
                // The error is already handled by the ApiClient
              }
            }
          }}
          test={test}
          student={student}
        />
      )}
    </>
  );
}

export default function AttemptPage() {
  return (
    <TestProvider>
      <Attempt />
    </TestProvider>
  );
}
