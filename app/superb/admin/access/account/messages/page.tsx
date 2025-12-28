"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Reply,
} from "lucide-react";

// Simple date formatting function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

interface ContactMessage {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  admin_response?: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
  };
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  );
  // Chat state
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  // Poll for new replies when a message is selected
  useEffect(() => {
    if (!selectedMessage) return;

    // Initial thread load
    loadThread(selectedMessage.id);

    const interval = setInterval(() => {
      loadThread(selectedMessage.id);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedMessage]);

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/admin/contact-messages");
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const { messages: data } = await response.json();
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // DEFINED HERE: loadThread function to fix ReferenceError
  const loadThread = async (messageId: string) => {
    try {
      const response = await fetch(`/api/contact/messages/${messageId}`);
      const data = await response.json();
      if (data.replies) {
        setReplies(data.replies);
      }
    } catch (error) {
      console.error("Error loading thread:", error);
    }
  };

  const selectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    // loadThread is handled by useEffect when selectedMessage changes
    if (message.status === "new") {
      markAsRead(message.id);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status: "read" }),
      });
      // Update local state without reload
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "read" as any } : m
        )
      );
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          message: replyText,
        }),
      });

      if (!response.ok) throw new Error("Failed to send reply");

      const { reply } = await response.json();

      setReplies([...replies, reply]);
      setReplyText("");

      // Update message status in list
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, status: "replied" } : m
        )
      );
    } catch (error: any) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "read":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "replied":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Contact Messages
          </h1>
          <p className="text-gray-400">
            View and respond to customer inquiries
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Total:{" "}
            <span className="text-white font-semibold">{messages.length}</span>
          </div>
          <div className="text-sm text-gray-400">
            New:{" "}
            <span className="text-blue-400 font-semibold">
              {messages.filter((m) => m.status === "new").length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {messages.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 border border-white/10 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => selectMessage(message)}
                className={`bg-gray-900 rounded-xl p-4 border cursor-pointer transition-all ${
                  selectedMessage?.id === message.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                      {message.subject}
                    </h3>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getStatusColor(
                      message.status
                    )}`}
                  >
                    {message.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3" />
                    <span>{message.name}</span>
                    {!message.user_id && (
                      <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">
                        Guest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail / Chat */}
        <div className="lg:col-span-2 flex flex-col bg-gray-900 rounded-xl border border-white/10 overflow-hidden">
          {selectedMessage ? (
            <>
              <div className="p-6 border-b border-white/10 bg-black/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-2" /> {selectedMessage.name}
                      </span>
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />{" "}
                        {selectedMessage.email}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm border ${getStatusColor(selectedMessage.status)}`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-black/40">
                {/* Original Message */}
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {formatDateTime(selectedMessage.created_at)}
                    </span>
                  </div>
                </div>

                {/* Replies */}
                {/* Retroactive Admin Response Support */}
                {selectedMessage.admin_response && replies.length === 0 && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                      <p className="whitespace-pre-wrap">
                        {selectedMessage.admin_response}
                      </p>
                      <span className="text-[10px] text-blue-200 block mt-1">
                        Previous Response
                      </span>
                    </div>
                  </div>
                )}

                {/* Replies List */}
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex ${reply.sender_role === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-3 max-w-[80%] rounded-2xl ${
                        reply.sender_role === "admin"
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-gray-800 text-gray-200 rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{reply.message}</p>
                      <span
                        className={`text-[10px] block mt-1 ${reply.sender_role === "admin" ? "text-blue-200" : "text-gray-400"}`}
                      >
                        {new Date(reply.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Reply className="w-4 h-4" />
                    <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
