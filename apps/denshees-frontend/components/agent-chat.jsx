"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUpIcon, ReloadIcon } from "mage-icons-react/stroke";
import {
  MessageSquareIcon,
  CancelIcon,
  MessageDotsRoundIcon,
} from "mage-icons-react/bulk";
import { Flipper, Flipped } from "react-flip-toolkit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/store/auth.store";

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  if (message.role === "tool") {
    return (
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[11px] rounded-full">
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          {message.toolName}
          <svg
            className="w-3 h-3 text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3 py-2 text-xs ${
          isUser
            ? "bg-black text-white whitespace-pre-wrap"
            : "bg-gray-100 text-gray-800 border border-gray-200 prose prose-xs prose-gray max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-1 [&_pre]:bg-gray-200 [&_pre]:p-2 [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:my-1.5 [&_h2]:my-1 [&_h3]:my-1 [&_a]:text-blue-600 [&_a]:underline [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:my-1 [&_blockquote]:text-gray-500 [&_hr]:my-2"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function ToolIndicator({ name }) {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[11px] rounded-full">
        <ReloadIcon className="w-3 h-3 animate-spin" />
        {name}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 border border-gray-200 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

async function saveMessages(token, threadId, msgs) {
  try {
    await fetch("/api/agent/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ thread_id: threadId, messages: msgs }),
    });
  } catch {
    // silent — saving is best-effort
  }
}

export default function AgentChat() {
  const { token, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [buttonContentVisible, setButtonContentVisible] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activeTool, setActiveTool] = useState(null);
  const [threadId, setThreadId] = useState(
    () => `${user?.id || "anon"}-${Date.now()}`,
  );
  const [threads, setThreads] = useState([]);
  const [showThreads, setShowThreads] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingRef = useRef("");

  // Load threads list
  const loadThreads = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/agent/threads", {
        headers: { Authorization: token },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch {
      // silent
    }
  }, [token]);

  // Load messages for current thread
  const loadHistory = useCallback(async () => {
    if (!token || !threadId) return;
    try {
      const res = await fetch(
        `/api/agent/history?thread_id=${encodeURIComponent(threadId)}`,
        { headers: { Authorization: token } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch {
      // silent
    } finally {
      setHistoryLoaded(true);
    }
  }, [token, threadId]);

  // Load history when panel opens or thread changes
  useEffect(() => {
    if (isOpen && token) {
      setHistoryLoaded(false);
      loadHistory();
      loadThreads();
    }
  }, [isOpen, threadId, token, loadHistory, loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, activeTool]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const startNewThread = useCallback(() => {
    const newId = `${user?.id || "anon"}-${Date.now()}`;
    setThreadId(newId);
    setMessages([]);
    setShowThreads(false);
  }, [user?.id]);

  const switchThread = useCallback((tid) => {
    setThreadId(tid);
    setMessages([]);
    setShowThreads(false);
  }, []);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      const userMsg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setIsLoading(true);
      streamingRef.current = "";
      setStreamingText("");

      // Collect new messages from this turn to save at the end
      const newMessages = [userMsg];

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ message: text, thread_id: threadId }),
        });

        if (!res.ok) throw new Error("Agent request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;

            try {
              const data = JSON.parse(payload);

              if (data.type === "token") {
                streamingRef.current += data.content;
                setStreamingText(streamingRef.current);
              } else if (data.type === "tool_start") {
                if (streamingRef.current) {
                  const t = streamingRef.current;
                  streamingRef.current = "";
                  setStreamingText("");
                  const assistantMsg = { role: "assistant", content: t };
                  newMessages.push(assistantMsg);
                  setMessages((prev) => [...prev, assistantMsg]);
                }
                setActiveTool(data.name);
              } else if (data.type === "tool_end") {
                setActiveTool(null);
                const toolMsg = {
                  role: "tool",
                  content: data.output || "",
                  toolName: data.name,
                };
                newMessages.push(toolMsg);
                setMessages((prev) => [...prev, toolMsg]);
              } else if (data.type === "error") {
                const errMsg = {
                  role: "assistant",
                  content: `Error: ${data.content}`,
                };
                newMessages.push(errMsg);
                setMessages((prev) => [...prev, errMsg]);
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        if (streamingRef.current) {
          const t = streamingRef.current;
          streamingRef.current = "";
          setStreamingText("");
          const assistantMsg = { role: "assistant", content: t };
          newMessages.push(assistantMsg);
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch {
        const errMsg = {
          role: "assistant",
          content:
            "Sorry, I couldn\u2019t process that. Please make sure the agent server is running and try again.",
        };
        newMessages.push(errMsg);
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        setActiveTool(null);
        streamingRef.current = "";
        setStreamingText("");

        // Persist all new messages from this turn
        if (token && newMessages.length > 0) {
          saveMessages(token, threadId, newMessages);
        }
      }
    },
    [input, isLoading, token, threadId],
  );

  return (
    <Flipper flipKey={isOpen} spring={{ stiffness: 600, damping: 60 }}>
      {/* Floating trigger button */}
      {!isOpen && (
        <Flipped
          flipId="agent-chat"
          onComplete={() => setButtonContentVisible(true)}
        >
          <button
            onClick={() => {
              setButtonContentVisible(false);
              setIsOpen(true);
            }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 border transition-colors duration-50 ${
              buttonContentVisible
                ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800"
                : "bg-white text-transparent border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <div
              className={`flex items-center gap-2 transition-opacity duration-50 ${
                buttonContentVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <MessageDotsRoundIcon className="w-4 h-4" />
              <span className="text-sm font-medium">AI Chat</span>
              {isLoading && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 bg-blue-500" />
                </span>
              )}
            </div>
          </button>
        </Flipped>
      )}

      {/* Chat panel */}
      {isOpen && (
        <Flipped flipId="agent-chat" onComplete={() => setContentVisible(true)}>
          <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[560px] bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div
              className={`flex flex-col flex-1 overflow-hidden transition-opacity duration-75 ${
                contentVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0">
                <div className="flex items-center gap-2">
                  <MessageDotsRoundIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">AI Assistant</span>
                  {isLoading && (
                    <ReloadIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowThreads((v) => !v)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                    title="Chat history"
                  >
                    {showThreads ? "Back" : "History"}
                  </button>
                  <button
                    onClick={startNewThread}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                    title="New chat"
                  >
                    + New
                  </button>
                  <button
                    onClick={() => {
                      setContentVisible(false);
                      setButtonContentVisible(false);
                      setIsOpen(false);
                      setShowThreads(false);
                    }}
                    className="hover:bg-gray-800 p-1 transition-colors"
                  >
                    <CancelIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thread list */}
              {showThreads ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {threads.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      No previous conversations
                    </p>
                  ) : (
                    threads.map((t) => (
                      <button
                        key={t.threadId}
                        onClick={() => switchThread(t.threadId)}
                        className={`w-full text-left px-3 py-2 text-xs border transition-colors ${
                          t.threadId === threadId
                            ? "bg-black text-white border-black"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="truncate font-medium">{t.preview}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${t.threadId === threadId ? "text-gray-300" : "text-gray-400"}`}
                        >
                          {new Date(t.lastMessage).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && !isLoading && historyLoaded && (
                      <div className="text-center py-6">
                        <MessageSquareIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          I can help you manage campaigns, leads, and pitches.
                        </p>
                        <div className="mt-3 space-y-2">
                          {[
                            "Show me all my campaigns",
                            "List my lead lists",
                            "Create a new campaign called Q1 Outreach",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => setInput(suggestion)}
                              className="w-full text-left text-xs bg-gray-50 border border-gray-200 px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                            >
                              &ldquo;{suggestion}&rdquo;
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <ChatMessage key={i} message={msg} />
                    ))}

                    {activeTool && <ToolIndicator name={activeTool} />}

                    {streamingText && (
                      <ChatMessage
                        message={{
                          role: "assistant",
                          content: streamingText,
                        }}
                      />
                    )}

                    {isLoading && !streamingText && !activeTool && (
                      <TypingIndicator />
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-200 p-3 shrink-0">
                    <form
                      onSubmit={handleSend}
                      className="flex items-end gap-2"
                    >
                      <Textarea
                        ref={inputRef}
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = "auto";
                          const lineHeight = 20;
                          const maxHeight = lineHeight * 3 + 16;
                          e.target.style.height =
                            Math.min(e.target.scrollHeight, maxHeight) + "px";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        disabled={isLoading}
                        className="text-sm min-h-[40px] max-h-[76px] resize-none overflow-y-auto"
                        rows={1}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={!input.trim() || isLoading}
                      >
                        {isLoading ? (
                          <ReloadIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUpIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </Flipped>
      )}
    </Flipper>
  );
}
