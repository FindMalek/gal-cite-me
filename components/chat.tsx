"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useState } from "react";
import { Files } from "@/components/files";
import { AnimatePresence, motion } from "framer-motion";
import { FileIcon } from "@/components/icons";
import { Message as PreviewMessage } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { UsageChart } from "@/components/usage-chart";
import { Session } from "next-auth";

const suggestedActions = [
  {
    title: "What's the summary",
    label: "of these documents?",
    action: "what's the summary of these documents?",
  },
  {
    title: "Who is the author",
    label: "of these documents?",
    action: "who is the author of these documents?",
  },
];

export function Chat({
  id,
  initialMessages,
  session,
}: {
  id: string;
  initialMessages: Array<Message>;
  session: Session | null;
}) {
  const [selectedFilePathnames, setSelectedFilePathnames] = useState<
    Array<string>
  >([]);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionUsage, setSessionUsage] = useState<
    Array<{
      source_doc_id: string;
      usage_count: number;
      journal: string;
      link: string;
    }>
  >([]);

  useEffect(() => {
    if (isMounted !== false && session && session.user) {
      localStorage.setItem(
        `${session.user.email}/selected-file-pathnames`,
        JSON.stringify(selectedFilePathnames),
      );
    }
  }, [selectedFilePathnames, isMounted, session]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (session && session.user) {
      setSelectedFilePathnames(
        JSON.parse(
          localStorage.getItem(
            `${session.user.email}/selected-file-pathnames`,
          ) || "[]",
        ),
      );
    }
  }, [session]);

  const { messages, handleSubmit, input, setInput, append } = useChat({
    body: { id, selectedFilePathnames },
    initialMessages,
    onFinish: async (message) => {
      window.history.replaceState({}, "", `/${id}`);
      
      // Extract citations from the assistant's response and update usage counts
      const citations = extractCitationsFromMessage(message.content);
      if (citations.length > 0) {
        updateSessionUsage(citations);
      }
    },
  });

  // Helper function to extract citations from assistant message
  const extractCitationsFromMessage = (text: string) => {
    const citationRegex = /\[Source: ([^\]]+) - ([^\]]+)\]\(([^)]+)\)/g;
    const citations = [];
    let match;
    
    while ((match = citationRegex.exec(text)) !== null) {
      citations.push({
        source_doc_id: match[1],
        section_heading: match[2],
        link: match[3],
      });
    }
    
    return citations;
  };

  // Helper function to update session usage counts
  const updateSessionUsage = (citations: any[]) => {
    setSessionUsage((prev) => {
      const updated = [...prev];
      
      citations.forEach((citation) => {
        const existing = updated.find(
          (item) => item.source_doc_id === citation.source_doc_id
        );
        
        if (existing) {
          existing.usage_count += 1;
        } else {
          updated.push({
            source_doc_id: citation.source_doc_id,
            usage_count: 1,
            journal: "Unknown", // We'd need to fetch this from the database
            link: citation.link,
          });
        }
      });
      
      return updated.sort((a, b) => b.usage_count - a.usage_count);
    });
  };

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex flex-col pb-10 h-dvh bg-white dark:bg-zinc-900">
      {/* Usage Chart - Top positioned, always visible */}
      <div className="w-full p-4 pt-14 border-b border-zinc-200 dark:border-zinc-800">
        <UsageChart sessionUsage={sessionUsage} />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-row justify-center flex-1">
        <div className="flex flex-col justify-between items-center gap-4 flex-1">
          <div
            ref={messagesContainerRef}
            className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
          >
            {messages.map((message, index) => (
              <PreviewMessage
                key={`${id}-${index}`}
                role={message.role}
                content={message.content}
              />
            ))}
            <div
              ref={messagesEndRef}
              className="flex-shrink-0 min-w-[24px] min-h-[24px]"
            />
          </div>

          {messages.length === 0 && (
            <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px]">
              {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  key={index}
                  className={index > 1 ? "hidden sm:block" : "block"}
                >
                  <button
                    onClick={async () => {
                      append({
                        role: "user",
                        content: suggestedAction.action,
                      });
                    }}
                    className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                  >
                    <span className="font-medium">{suggestedAction.title}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {suggestedAction.label}
                    </span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <form
            className="flex flex-row gap-2 relative items-center w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0"
            onSubmit={handleSubmit}
          >
            <input
              className="bg-zinc-100 rounded-md px-2 py-1.5 flex-1 outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300"
              placeholder="Send a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />

            <div
              className="relative text-sm bg-zinc-100 rounded-lg size-9 flex-shrink-0 flex flex-row items-center justify-center cursor-pointer hover:bg-zinc-200 dark:text-zinc-50 dark:bg-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => {
                setIsFilesVisible(!isFilesVisible);
              }}
            >
              <FileIcon />
              <motion.div
                className="absolute text-xs -top-2 -right-2 bg-blue-500 size-5 rounded-full flex flex-row justify-center items-center border-2 dark:border-zinc-900 border-white text-blue-50"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {selectedFilePathnames?.length}
              </motion.div>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {isFilesVisible && (
            <Files
              setIsFilesVisible={setIsFilesVisible}
              selectedFilePathnames={selectedFilePathnames}
              setSelectedFilePathnames={setSelectedFilePathnames}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
