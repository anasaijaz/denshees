"use client";

import { useState, useEffect, useRef } from "react";
import {
  CancelIcon,
  MessagePlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from "mage-icons-react/bulk";
import { ArrowUpIcon, ReloadIcon } from "mage-icons-react/stroke";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Flipper, Flipped } from "react-flip-toolkit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { mutate } from "swr";

// ── Progress bar component ─────────────────────────────────
function ProgressIndicator({ progress }) {
  if (!progress) return null;

  const { total, created, failed, currentLead, currentIndex, status } =
    progress;
  const percent =
    total > 0 ? Math.round(((created + failed) / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {status === "completed"
            ? "Completed"
            : currentLead
              ? `Adding: ${currentLead}`
              : "Starting..."}
        </span>
        <span>
          {currentIndex ?? created + failed}/{total}
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor:
              status === "completed"
                ? failed > 0
                  ? "#f59e0b"
                  : "#22c55e"
                : "#3b82f6",
          }}
        />
      </div>
      <div className="flex gap-3 text-xs">
        {created > 0 && (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            {created} added
          </span>
        )}
        {failed > 0 && (
          <span className="text-red-500 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {failed} failed
          </span>
        )}
      </div>
    </div>
  );
}

// ── Realtime run tracker ───────────────────────────────────
function RunTracker({ runId, accessToken, onComplete, listId }) {
  const { run } = useRealtimeRun(runId, {
    accessToken,
    enabled: !!runId,
  });

  const progress = run?.metadata?.progress;
  const isComplete = run?.status === "COMPLETED";
  const isFailed =
    run?.status === "FAILED" ||
    run?.status === "CRASHED" ||
    run?.status === "SYSTEM_FAILURE";

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isComplete && run?.output) {
      onCompleteRef.current?.(run.output);
      // Revalidate list items
      mutate(`/api/lead-lists/${listId}/items`);
    }
  }, [isComplete, run?.output, listId]);

  useEffect(() => {
    if (isFailed) {
      onCompleteRef.current?.({ error: true });
    }
  }, [isFailed]);

  return (
    <div className="space-y-2">
      {!isComplete && !isFailed && (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <ReloadIcon className="w-3.5 h-3.5 animate-spin" />
          <span>Adding leads to list...</span>
        </div>
      )}
      <ProgressIndicator progress={progress} />
      {isComplete && run?.output && (
        <div className="border border-green-200 bg-green-50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Done! {run.output.created} lead
            {run.output.created !== 1 ? "s" : ""} added
            {run.output.failed > 0 && (
              <span className="text-amber-600">
                , {run.output.failed} failed
              </span>
            )}
          </div>
        </div>
      )}
      {isFailed && (
        <div className="border border-red-200 bg-red-50 p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            Task failed. Please try again.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lead preview card ──────────────────────────────────────
function LeadPreview({ leads, onConfirm, onEdit, onCancel, isSubmitting }) {
  return (
    <div className="space-y-3">
      <div className="border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} parsed
          </span>
        </div>
        <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-50">
          {leads.map((lead, i) => (
            <div key={i} className="px-3 py-2 flex items-start gap-2">
              <UserPlusIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {lead.name || "Unnamed"}
                </p>
                {lead.email && (
                  <p className="text-[11px] text-blue-600 truncate">
                    {lead.email}
                  </p>
                )}
                {lead.company && (
                  <p className="text-[11px] text-gray-400 truncate">
                    {lead.company}
                  </p>
                )}
                {lead.personalization &&
                  Object.keys(lead.personalization).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(lead.personalization).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5"
                        >
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          size="sm"
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <ReloadIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlusIcon className="w-3.5 h-3.5 mr-1.5" />
              Add {leads.length} lead{leads.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Chat message component ─────────────────────────────────
function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-3 py-2 text-xs ${
          isUser
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-800 border border-gray-200"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function AddLeadsChat({ listId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [parsedLeads, setParsedLeads] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger run tracking
  const [activeRun, setActiveRun] = useState(null); // { runId, tag, publicToken }
  const [contentVisible, setContentVisible] = useState(false);
  const [buttonContentVisible, setButtonContentVisible] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, parsedLeads, activeRun]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Handle message send ──────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isParsing) return;

    // Add user message
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
    // Capture current leads before clearing for context
    const leadsSnapshot = parsedLeads;
    setIsParsing(true);
    setParsedLeads(null);

    try {
      // Build conversation context (last 10 messages including hidden)
      const recentHistory = messages.slice(-10);

      const res = await fetch("/api/ai/parse-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: recentHistory,
          currentLeads: leadsSnapshot,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse leads");
      }

      const data = await res.json();

      // Add assistant message
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }

      // Show lead preview if leads were extracted
      if (data.leads && data.leads.length > 0) {
        setParsedLeads(data.leads);
        // Add leads summary to conversation so AI has context for follow-ups
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `[Parsed leads: ${data.leads.map((l, i) => `${i + 1}. ${l.name || "Unnamed"}${l.email ? " (" + l.email + ")" : ""}${l.company ? " at " + l.company : ""}`).join(", ")}]`,
            hidden: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I had trouble understanding that. Could you try describing the leads again?",
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  };

  // ── Confirm & trigger add-lead-to-list task ──────────
  const handleConfirmAdd = async () => {
    if (!parsedLeads || parsedLeads.length === 0 || !listId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/lead-lists/${listId}/add-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: parsedLeads }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger task");
      }

      const { runId, tag, publicToken } = await res.json();
      setActiveRun({ runId, tag, publicToken });
      setParsedLeads(null);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Adding ${parsedLeads.length} lead${parsedLeads.length !== 1 ? "s" : ""} to your list...`,
        },
      ]);
    } catch (err) {
      toast.error(err.message || "Failed to add leads");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to start adding leads. Please try again.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle run completion ────────────────────────────
  const handleRunComplete = (output) => {
    setActiveRun(null);
    if (output?.error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "The task failed. Please try again.",
        },
      ]);
    } else if (output) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Done! Added ${output.created} lead${output.created !== 1 ? "s" : ""}${output.failed > 0 ? ` (${output.failed} failed)` : ""}. You can add more leads or close the chat.`,
        },
      ]);
    }
  };

  const handleCancelPreview = () => {
    setParsedLeads(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "No problem! Describe the leads you'd like to add whenever you're ready.",
      },
    ]);
  };

  const isRunning = !!activeRun;

  return (
    <Flipper flipKey={isOpen} spring={{ stiffness: 600, damping: 60 }}>
      {/* Floating trigger button */}
      {!isOpen && (
        <Flipped
          flipId="add-leads-chat"
          onComplete={() => setButtonContentVisible(true)}
        >
          <button
            onClick={() => {
              setButtonContentVisible(false);
              setIsOpen(true);
            }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 border transition-colors duration-50 ${buttonContentVisible ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800" : "bg-white text-transparent border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"}`}
          >
            <div
              className={`flex items-center gap-2 transition-opacity duration-50 ${buttonContentVisible ? "opacity-100" : "opacity-0"}`}
            >
              <MessagePlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Add Leads</span>
              {isRunning && (
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
        <Flipped
          flipId="add-leads-chat"
          onComplete={() => setContentVisible(true)}
        >
          <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[560px] bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div
              className={`flex flex-col flex-1 overflow-hidden transition-opacity duration-75 ${contentVisible ? "opacity-100" : "opacity-0"}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">Add Leads</span>
                  {isRunning && (
                    <ReloadIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  )}
                </div>
                <button
                  onClick={() => {
                    setContentVisible(false);
                    setButtonContentVisible(false);
                    setIsOpen(false);
                  }}
                  className="hover:bg-gray-800 p-1 transition-colors"
                >
                  <CancelIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Welcome message */}
                {messages.length === 0 && !parsedLeads && !activeRun && (
                  <div className="text-center py-6">
                    <MessagePlusIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Describe the leads you want to add. For example:
                    </p>
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() =>
                          setInput(
                            "Add John Doe (john@example.com) from Acme Inc as a Sales Manager",
                          )
                        }
                        className="w-full text-left text-xs bg-gray-50 border border-gray-200 px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        &ldquo;Add John Doe (john@example.com) from Acme Inc as
                        a Sales Manager&rdquo;
                      </button>
                      <button
                        onClick={() =>
                          setInput(
                            "Add these 3 leads: Sarah Chen sarah@tech.io CTO at TechCo, Mike Ross mike@law.com Partner at PearsonHardman, Rachel Zane rachel@law.com Associate",
                          )
                        }
                        className="w-full text-left text-xs bg-gray-50 border border-gray-200 px-3 py-2 hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        &ldquo;Add these 3 leads: Sarah Chen sarah@tech.io CTO
                        at TechCo, Mike Ross...&rdquo;
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {messages
                  .filter((msg) => !msg.hidden)
                  .map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                  ))}

                {/* Typing indicator */}
                {isParsing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 border border-gray-200 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Lead preview */}
                {parsedLeads && (
                  <LeadPreview
                    leads={parsedLeads}
                    onConfirm={handleConfirmAdd}
                    onCancel={handleCancelPreview}
                    isSubmitting={isSubmitting}
                  />
                )}

                {/* Active run tracker */}
                {activeRun && (
                  <RunTracker
                    runId={activeRun.runId}
                    accessToken={activeRun.publicToken}
                    onComplete={handleRunComplete}
                    listId={listId}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-3 shrink-0">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <Textarea
                    ref={inputRef}
                    placeholder="Describe leads to add..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize up to 3 lines
                      e.target.style.height = "auto";
                      const lineHeight = 20;
                      const maxHeight = lineHeight * 3 + 16; // 3 lines + padding
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, maxHeight) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    disabled={isParsing || isSubmitting || !!activeRun}
                    className="text-sm min-h-[40px] max-h-[76px] resize-none overflow-y-auto"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={
                      !input.trim() || isParsing || isSubmitting || !!activeRun
                    }
                  >
                    {isParsing ? (
                      <ReloadIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpIcon className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Flipped>
      )}
    </Flipper>
  );
}
