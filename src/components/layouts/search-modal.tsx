"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Test, Folder } from "@/types/test";
import { X, Search, FileText, Folder as FolderIcon, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarData {
  folders: (Folder & { tests: Test[] })[];
  tests: Test[];
}

async function fetchSearchData(searchQuery: string): Promise<SidebarData> {
  const params = new URLSearchParams();
  if (searchQuery.trim()) {
    params.append('q', searchQuery.trim());
  }

  const url = `/api/tests/list${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch search data");
  }
  const data = await response.json();
  return data.data;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["search-data", searchTerm],
    queryFn: () => fetchSearchData(searchTerm),
    enabled: isOpen,
  });

  // Clear search term when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Since API now handles all filtering server-side, we just organize the results
  const processedResults = (() => {
    if (!searchData) return { foldersWithTests: [], standaloneTests: [] as Test[] };

    // Create a map to organize data by folder
    const folderMap = new Map();
    const standaloneTests: Test[] = [];

    // Process folders and their tests (API has already filtered these)
    searchData.folders.forEach(folderData => {
      folderMap.set(folderData.id, {
        folder: folderData,
        tests: folderData.tests || [],
        isFolderMatch: true,
        hasTestMatches: (folderData.tests || []).length > 0
      });
    });

    // Process standalone tests
    searchData.tests.forEach((test: Test) => {
      standaloneTests.push(test);
    });

    // Convert map to array and sort
    const foldersWithTests = Array.from(folderMap.values())
      .sort((a, b) => a.folder.name.localeCompare(b.folder.name));

    return { foldersWithTests, standaloneTests };
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
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
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 bg-black rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Results Section */}
                  {(processedResults.foldersWithTests.length > 0 || processedResults.standaloneTests.length > 0) && (
                    <div>
                      <div className="space-y-6">
                        {/* Folders Section - complete section wrapper */}
                        {processedResults.foldersWithTests.length > 0 && (
                          <div>
                            <h3 className="text-[14px] text-zinc-500 mb-2 px-2 font-medium">Folders</h3>
                            <div className="space-y-2">
                              {processedResults.foldersWithTests.map((item) => (
                                <div key={item.folder.id}>
                                  {/* Folder header */}
                                  <Link href={`/f/${item.folder.id}`} onClick={onClose}>
                                    <div className="block p-2 rounded-lg hover:bg-gray-100">
                                      <div className="flex items-center gap-2">
                                        <FolderIcon className="h-5 w-5 opacity-50" />
                                        <span className="text-sm font-medium">{item.folder.name}</span>
                                      </div>
                                    </div>
                                  </Link>

                                  {/* Tests under this folder */}
                                  {item.tests.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {item.tests.map((test: Test, index: number) => (
                                        <div key={test.id}>
                                          <Link href={`/t/${test.id}`} onClick={onClose}>
                                            <div className="px-3 py-2 cursor-pointer hover:bg-zinc-50 transition-colors rounded-md">
                                              <div className="flex items-center gap-2 text-sm">
                                                <Brain className="h-5 w-5 text-black flex-shrink-0" />
                                                <span className="truncate font-medium text-black">
                                                  {test.title}
                                                </span>
                                              </div>
                                              {test.description && (
                                                <p className="text-xs text-zinc-600 mt-1 ml-6 line-clamp-1">
                                                  {test.description.length > 50
                                                    ? `${test.description.substring(0, 50)}...`
                                                    : test.description
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          </Link>
                                          {index < item.tests.length - 1 && (
                                            <div className="border-b border-zinc-200 mx-0 ml-6" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Standalone Tests Section - complete section wrapper */}
                        {processedResults.standaloneTests.length > 0 && (
                          <div>
                            <h3 className="text-[14px] text-zinc-500 mb-2 px-2 font-medium">Standalone Tests</h3>
                            <div className="space-y-1">
                              {processedResults.standaloneTests.map((test: Test) => (
                                <div key={test.id}>
                                  <Link href={`/t/${test.id}`} onClick={onClose}>
                                    <div className="px-2 py-2 cursor-pointer hover:bg-zinc-50 transition-colors rounded-md">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Brain className="h-5 w-5 text-black flex-shrink-0" />
                                        <span className="truncate font-medium text-black">
                                          {test.title}
                                        </span>
                                      </div>
                                      {test.description && (
                                        <p className="text-xs text-zinc-600 mt-1 ml-6">
                                          {test.description.length > 50
                                            ? `${test.description.substring(0, 50)}...`
                                            : test.description
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {processedResults.foldersWithTests.length === 0 && processedResults.standaloneTests.length === 0 && searchTerm && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No results found for "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
