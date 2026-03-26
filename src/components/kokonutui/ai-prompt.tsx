"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  FileText,
  LayoutGrid,
  ListChecks,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";

type QuestionKind = "objective" | "theory" | "mixed";

/** Inline RGBA so the tint always paints (Tailwind bg on this trigger was not applying reliably). */
const QUESTION_KIND_TRIGGER_BG: Record<
  QuestionKind,
  { idle: string; hover: string }
> = {
  mixed: {
    idle: "rgba(34, 197, 94, 0.22)",
    hover: "rgba(34, 197, 94, 0.34)",
  },
  objective: {
    idle: "rgba(217, 70, 239, 0.22)",
    hover: "rgba(217, 70, 239, 0.34)",
  },
  theory: {
    idle: "rgba(99, 102, 241, 0.22)",
    hover: "rgba(99, 102, 241, 0.34)",
  },
};

/** Inline `color` so every mode tints label + caret (Tailwind `text-fuchsia-*` / `text-indigo-*` was not reliably applied on this trigger). */
const QUESTION_KIND_TRIGGER_FG: Record<
  QuestionKind,
  { light: { idle: string; hover: string }; dark: { idle: string; hover: string } }
> = {
  mixed: {
    light: { idle: "#15803d", hover: "#14532d" },
    dark: { idle: "#4ade80", hover: "#86efac" },
  },
  objective: {
    light: { idle: "#a21caf", hover: "#86198f" },
    dark: { idle: "#e879f9", hover: "#f0abfc" },
  },
  theory: {
    light: { idle: "#4338ca", hover: "#3730a3" },
    dark: { idle: "#818cf8", hover: "#a5b4fc" },
  },
};

const QUESTION_KIND_LABEL: Record<QuestionKind, string> = {
  mixed: "Mixed",
  objective: "Choice",
  theory: "Written",
};

interface AIPromptProps {
  onSubmit: (
    value: string,
    mode: string,
    questionKind?: "objective" | "theory" | "mixed"
  ) => void;
  hideBottomTools?: boolean;
  placeholder?: string;
  showHeader?: boolean;
  topTitle?: React.ReactNode;
  disabled?: boolean;
  /** When true, shows a toggle to generate multiple-choice vs long-form (theory) questions. */
  showQuestionKindToggle?: boolean;
}

export default function AI_Prompt({
  onSubmit,
  hideBottomTools = false,
  placeholder,
  showHeader = false,
  topTitle,
  showQuestionKindToggle = false,
}: AIPromptProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMode, setSelectedMode] = useState("text");
  const [questionKind, setQuestionKind] = useState<QuestionKind>("mixed");
  const [kindTriggerHover, setKindTriggerHover] = useState(false);
  const { resolvedTheme } = useTheme();

  const kindBg = QUESTION_KIND_TRIGGER_BG[questionKind];
  const kindFg =
    QUESTION_KIND_TRIGGER_FG[questionKind][
      resolvedTheme === "dark" ? "dark" : "light"
    ];
  const kindLabel = QUESTION_KIND_LABEL[questionKind];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      const textToSend = message.trim();
      onSubmit(
        textToSend,
        selectedMode,
        showQuestionKindToggle ? questionKind : undefined
      );
      setMessage("");
      setIsExpanded(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    setIsExpanded(e.target.value.length > 100 || e.target.value.includes("\n"));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full">
      {showHeader && topTitle && (
        <div className="mb-7 mx-auto max-w-2xl text-center px-1 text-pretty text-foreground">
          {topTitle}
        </div>
      )}
      {showHeader && !topTitle && (
        <h1 className="mb-7 mx-auto max-w-2xl text-center text-2xl font-semibold leading-9 text-foreground px-1 text-pretty whitespace-pre-wrap">
          Generate Test Content
        </h1>
      )}
      <form onSubmit={handleSubmit} className="group/composer w-full">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
           onChange={(e) => {}}
        />

        <div
          className={cn(
            "w-full max-w-2xl mx-auto bg-white cursor-text overflow-clip bg-clip-padding p-2.5 shadow-lg border border-border transition-all duration-200",
            {
              "rounded-3xl grid grid-cols-1 grid-rows-[auto_1fr_auto]":
                isExpanded,
              "rounded-[28px] grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto]":
                !isExpanded,
            }
          )}
          style={{
            gridTemplateAreas: isExpanded
              ? showQuestionKindToggle
                ? "'leading' 'primary' 'footer'"
                : "'header' 'primary' 'footer'"
              : "'header header header' 'leading primary trailing' '. footer .'",
          }}
        >
          <div
            className={cn(
              "flex min-14 items-center overflow-x-hidden px-1.5",
              {
                "px-2 py-1 mb-0": isExpanded,
                "-my-2.5": !isExpanded,
              }
            )}
            style={{ gridArea: "primary" }}
          >
            <div className="flex-1 overflow-auto max-h-52">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Ask anything"}
                className="min-h-0 resize-none rounded-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin dark:bg-transparent"
                rows={1}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-0.5",
              {
                hidden: isExpanded && !showQuestionKindToggle,
              },
              isExpanded &&
                showQuestionKindToggle &&
                "px-2 pb-1 pt-0.5"
            )}
            style={{ gridArea: "leading" }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full hover:bg-accent outline-none ring-0"
                  aria-label="Add photos, files, and more"
                >
                  <Plus className="size-6 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="max-w-xs rounded-2xl p-1.5"
              >
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={20} className="opacity-60" />
                    Add photos & files
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => {}}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} className="opacity-60" />
                      Agent mode
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-[calc(1rem-6px)]"
                    onClick={() => {}}
                  >
                    <Search size={20} className="opacity-60" />
                    Deep Research
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {showQuestionKindToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border-0 px-4 py-2 text-sm font-semibold shadow-none outline-none transition-[color,background-color] duration-150",
                      "focus-visible:border-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      "cursor-pointer disabled:pointer-events-none disabled:opacity-50",
                      "[&_svg]:pointer-events-none [&_svg]:shrink-0"
                    )}
                    style={{
                      backgroundColor: kindTriggerHover
                        ? kindBg.hover
                        : kindBg.idle,
                      color: kindTriggerHover ? kindFg.hover : kindFg.idle,
                    }}
                    onMouseEnter={() => setKindTriggerHover(true)}
                    onMouseLeave={() => setKindTriggerHover(false)}
                    aria-label={`Question mode: ${kindLabel}. Open to change.`}
                  >
                    <span className="text-sm font-semibold">{kindLabel}</span>
                    <ChevronDown
                      className="size-4 shrink-0 opacity-90"
                      aria-hidden
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,22rem)] rounded-2xl p-1.5"
                >
                  <DropdownMenuLabel className="px-2 pb-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">
                    What should the AI generate?
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={questionKind}
                    onValueChange={(v) => setQuestionKind(v as QuestionKind)}
                    className="space-y-1"
                  >
                    <DropdownMenuRadioItem
                      value="mixed"
                      className="items-start gap-2 rounded-[calc(1rem-6px)] py-2.5 pr-2 [&>span:first-child]:top-3"
                    >
                      <LayoutGrid
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-70"
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium leading-snug text-foreground">
                          Choice and written questions
                        </span>
                        <span className="text-xs font-normal leading-snug text-muted-foreground">
                          Multiple-choice-style items and long-form answers in
                          the same test.
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="objective"
                      className="items-start gap-2 rounded-[calc(1rem-6px)] py-2.5 pr-2 [&>span:first-child]:top-3"
                    >
                      <ListChecks
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-70"
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium leading-snug text-foreground">
                          Choice questions only
                        </span>
                        <span className="text-xs font-normal leading-snug text-muted-foreground">
                          Multiple-choice, true/false, fill-in-the-blank—no long
                          essays.
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="theory"
                      className="items-start gap-2 rounded-[calc(1rem-6px)] py-2.5 pr-2 [&>span:first-child]:top-3"
                    >
                      <FileText
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-70"
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium leading-snug text-foreground">
                          Written questions only
                        </span>
                        <span className="text-xs font-normal leading-snug text-muted-foreground">
                          Long-form answers students type in full sentences or
                          paragraphs.
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div
            className="flex items-center gap-2"
            style={{ gridArea: isExpanded ? "footer" : "trailing" }}
          >
            <div className="ms-auto flex items-center gap-1.5">
              {/* Comment out voice icon */}
              {/* <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <IconMicrophone className="size-5 text-muted-foreground" />
              </Button> */}

              {/* Comment out wave icon */}
              {/* <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent relative"
              >
                <IconWaveSine className="size-5 text-muted-foreground" />
              </Button> */}

              {message.trim() && (
                <Button
                  type="submit"
                  size="icon"
                  className="!size-9 flex justify-center items-center rounded-full"
                >
                  <Send className="!size-[16px]" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
