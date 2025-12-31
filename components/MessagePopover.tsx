"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  ExternalLink,
  Loader2,
  Send,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  admin_response?: string;
  status: string;
}

interface Reply {
  id: string;
  message_id: string;
  sender_role: "user" | "admin";
  message: string;
  created_at: string;
}

interface FullMessageThread extends Message {
  replies?: Reply[];
}

export default function MessagePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Chat View State
  const [selectedThread, setSelectedThread] =
    useState<FullMessageThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    } else {
      // Reset state when closed
      setSelectedThread(null);
    }
  }, [isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (selectedThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedThread?.replies, selectedThread]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/contact/messages");
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (message: Message) => {
    setLoadingThread(true);
    try {
      const response = await fetch(`/api/contact/messages/${message.id}`);
      const data = await response.json();
      if (data.message) {
        setSelectedThread({ ...data.message, replies: data.replies || [] });
      }
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setLoadingThread(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedThread.id,
          message: replyText,
        }),
      });

      if (!response.ok) throw new Error("Failed to send");

      const { reply } = await response.json();

      // Optimistically update UI
      setSelectedThread((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          replies: [...(prev.replies || []), reply],
        };
      });
      setReplyText("");
    } catch (error) {
      console.error("Error replying:", error);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:text-blue-500 transition-colors relative"
      >
        <MessageSquare className="w-5 h-5" />
        {messages.some((m) => m.admin_response && m.status !== "read") && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[90vw] bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
            {selectedThread ? (
              <button
                onClick={() => setSelectedThread(null)}
                className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            ) : (
              <h3 className="text-white font-semibold">Messages & Support</h3>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-gray-900/50 relative">
            {loading ? (
              <div className="flex justify-center p-8 text-blue-500 h-full items-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : selectedThread ? (
              // CHAT VIEW
              <div className="flex flex-col min-h-full pb-4">
                {/* Original Message (pinned at top effectively by being first) */}
                <div className="p-4 border-b border-white/5 bg-gray-800/30 mb-4">
                  <h4 className="font-bold text-white mb-1">
                    {selectedThread.subject}
                  </h4>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedThread.message}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-2">
                    {new Date(selectedThread.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Replies */}
                <div className="px-4 space-y-4 flex-1">
                  {/* Legacy single admin_response support */}
                  {selectedThread.admin_response &&
                    (!selectedThread.replies ||
                      selectedThread.replies.length === 0) && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2 bg-gray-800 text-gray-200 text-sm">
                          <p>{selectedThread.admin_response}</p>
                          <span className="text-[10px] text-gray-400 block mt-1 text-right">
                            Admin Response
                          </span>
                        </div>
                      </div>
                    )}

                  {selectedThread.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`flex ${reply.sender_role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          reply.sender_role === "user"
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-gray-800 text-gray-200 rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                        <span
                          className={`text-[10px] block mt-1 ${reply.sender_role === "user" ? "text-blue-200" : "text-gray-400"}`}
                        >
                          {new Date(reply.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              // LIST VIEW
              <div className="p-2 space-y-2">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center h-full">
                    <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => openThread(msg)}
                      className={`p-3 rounded-lg text-sm border cursor-pointer hover:bg-white/5 transition-colors ${
                        msg.admin_response
                          ? "bg-blue-500/10 border-blue-500/20"
                          : "bg-black/40 border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-white line-clamp-1">
                          {msg.subject}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-400 line-clamp-2 mb-2">
                        {msg.message}
                      </p>

                      {msg.admin_response || msg.status === "replied" ? (
                        <div className="flex items-center text-[10px] text-blue-400 mt-1">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {msg.status === "new" ? "Replied" : "Replied"}
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] text-yellow-500 mt-1">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse" />
                          Awaiting response
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer / Input Area */}
          <div className="p-3 border-t border-white/10 bg-black/40 shrink-0">
            {selectedThread ? (
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open New Ticket
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
