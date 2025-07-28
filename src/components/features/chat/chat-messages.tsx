import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type Message = {
  id: string;
  sender: "user" | "system" | "user-action" | "system-llm-response";
  content: ReactNode;
  fullWidth?: boolean;
};

interface ChatMessagesProps {
  messages: Message[];
  isArtifactVisible: boolean;
}

export function ChatMessages({ messages, isArtifactVisible }: ChatMessagesProps) {
  return (
    <div className="space-y-6">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex",
            msg.sender === "user" || msg.sender === "user-action"
              ? "justify-end"
              : "justify-start"
          )}
        >
          <div
            className={cn(
              {
                "px-[16px] py-[8px] rounded-[16px] shadow-none bg-zinc-500 text-white max-w-[60%]":
                  msg.sender === "user",
                "w-3/5":
                  (msg.sender === "system" || msg.sender === "system-llm-response") &&
                  !isArtifactVisible &&
                  !msg.fullWidth,
                "w-4/5":
                  (msg.sender === "system" || msg.sender === "system-llm-response") &&
                  isArtifactVisible &&
                  !msg.fullWidth,
                "w-full": msg.fullWidth,
                "text-zinc-500 italic": msg.sender === "user-action",
              },
              "text-[14px]"
            )}
          >
            {msg.sender === "system-llm-response" && typeof msg.content === "string" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
