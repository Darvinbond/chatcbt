"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Test } from "@/types/test";
import { X, Search, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function fetchTests(): Promise<Test[]> {
  const response = await fetch("/api/tests/list");
  if (!response.ok) {
    throw new Error("Failed to fetch tests");
  }
  const data = await response.json();
  return data.data;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: tests, isLoading } = useQuery({
    queryKey: ["search-tests"],
    queryFn: fetchTests,
    enabled: isOpen,
  });

  const filteredTests =
    tests?.filter((test) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-2xl border border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center">
              <Search className="h-5 w-5 mr-2" />
              <input
                type="text"
                placeholder="Search tests..."
                className="w-full outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 h-96 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul>
                  {filteredTests.map((test) => (
                    <li key={test.id}>
                      <Link href={`/t/${test.id}`}>
                        <div className="block p-2 rounded-lg hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 opacity-50" />
                            <span className="text-sm font-medium">{test.title}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 ml-7">
                            {test.duration} minutes • {test.students?.length || 0} students
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
