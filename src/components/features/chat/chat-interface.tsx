import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type Message = {
  id: string;
  sender: "user" | "system" | "user-action";
  content: ReactNode;
};

interface ChatInterfaceProps {
  messages: Message[];
  isArtifactVisible: boolean;
}

export function ChatInterface({ messages, isArtifactVisible }: ChatInterfaceProps) {
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
            className={cn({
              "p-4 rounded-lg shadow-md bg-blue-500 text-white max-w-[60%]":
                msg.sender === "user",
              "w-3/5": msg.sender === "system" && !isArtifactVisible,
              "w-4/5": msg.sender === "system" && isArtifactVisible,
              "text-sm text-zinc-500 italic": msg.sender === "user-action",
            })}
          >
            {msg.content}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
