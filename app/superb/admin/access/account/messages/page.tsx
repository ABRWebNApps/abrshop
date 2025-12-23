"use client";

import { useState, useEffect } from "react";
import { Mail, MessageSquare, User, Calendar, CheckCircle, XCircle, Reply } from "lucide-react";
// Simple date formatting function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
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
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

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
      alert("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status: "read" }),
      });
      if (!response.ok) throw new Error("Failed to update");
      loadMessages();
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setReplying(true);
    try {
      const response = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          status: "replied",
          adminResponse: replyText,
        }),
      });

      if (!response.ok) throw new Error("Failed to send reply");

      // Send reply email (you can enhance this with actual email service)
      await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: `Re: ${selectedMessage.subject}`,
          message: replyText,
          originalMessage: selectedMessage.message,
        }),
      });

      alert("Reply sent successfully!");
      setReplyText("");
      setSelectedMessage(null);
      loadMessages();
    } catch (error: any) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    } finally {
      setReplying(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">Contact Messages</h1>
          <p className="text-gray-400">View and respond to customer inquiries</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Total: <span className="text-white font-semibold">{messages.length}</span>
          </div>
          <div className="text-sm text-gray-400">
            New:{" "}
            <span className="text-blue-400 font-semibold">
              {messages.filter((m) => m.status === "new").length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3">
          {messages.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 border border-white/10 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message);
                  if (message.status === "new") {
                    markAsRead(message.id);
                  }
                }}
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
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-gray-900 rounded-xl p-6 border border-white/10 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{selectedMessage.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDateTime(selectedMessage.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm border ${getStatusColor(
                      selectedMessage.status
                    )}`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {selectedMessage.admin_response && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Your Response</h3>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {selectedMessage.admin_response}
                    </p>
                  </div>
                </div>
              )}

              {selectedMessage.status !== "replied" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Reply</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="mt-3 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Reply className="w-4 h-4" />
                    <span>{replying ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-12 border border-white/10 text-center">
              <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

