"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X, Sparkles } from "lucide-react";
import ChatProductCard from "./ChatProductCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: any[];
  recommendations?: any[];
  clarifyingQuestion?: string | null;
  timestamp: Date;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Wahala! Na me be Athena, your smart AI shopping assistant for tech products. 👋\n\nI fit help you find the perfect gadgets wey you dey find! Just tell me wetin you want - for example:\n• "I need laptop for video editing under ₦2,000,000"\n• "Show me phones wey get good camera"\n• "Wetin you get for gaming setup?"\n• "I need wireless earpiece for my phone"\n\nWetin you want make I help you find today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "I found some options for you!",
        products: data.products || [],
        recommendations: data.recommendations || [],
        clarifyingQuestion: data.clarifyingQuestion || null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please try again or use the regular search.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group relative overflow-hidden cursor-pointer"
        aria-label="Open Athena AI Assistant"
        style={{ zIndex: 9999, position: "fixed" }}
      >
        {/* Navy blue to silver gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#cbd5e1] rounded-full"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#60a5fa] to-[#e2e8f0] rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#94a3b8] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {/* Animated icon with multiple effects */}
        <div className="relative z-10">
          <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg animate-sparkle" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white/30 blur-sm animate-pulse-slow" />
          </div>
        </div>
        {/* Pulse ring effect with navy blue */}
        <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6]/50 animate-ping"></div>
        {/* Rotating glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-[#60a5fa]/20 to-transparent animate-spin-slow"></div>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
          Chat with Athena AI
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-full max-w-md h-[600px] md:h-[700px] bg-black border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#cbd5e1] rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#cbd5e1] rounded-full animate-pulse opacity-75"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#60a5fa] to-[#e2e8f0] rounded-full blur-sm"></div>
            <div className="relative z-10">
              <Sparkles className="w-4 h-4 text-white animate-sparkle" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white/30 blur-sm animate-pulse-slow" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">
              Athena AI
            </h3>
            <p className="text-xs text-gray-400">
              Your smart tech shopping assistant
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2"
                  : "bg-gray-900 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10"
              }`}
            >
              <p className="text-sm md:text-base whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Products */}
              {message.products && message.products.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-400 mb-2">
                    ✨ Found {message.products.length} perfect match
                    {message.products.length > 1 ? "es" : ""}:
                  </p>
                  {message.products.map((product) => (
                    <ChatProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {message.recommendations &&
                message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-400 mb-2">
                      💡 You might also like:
                    </p>
                    {message.recommendations.map((product) => (
                      <ChatProductCard
                        key={product.id}
                        product={product}
                        isRecommendation={true}
                      />
                    ))}
                  </div>
                )}

              {/* Clarifying Question */}
              {message.clarifyingQuestion && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">
                    {message.clarifyingQuestion}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction("Yes, show me options")}
                      className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      Yes, show me options
                    </button>
                    <button
                      onClick={() => handleQuickAction("No, something else")}
                      className="text-xs px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-white/10 hover:bg-gray-700 transition-colors"
                    >
                      Something else
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-white/10 p-4 bg-gray-900"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about products..."
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm md:text-base border border-white/10 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Try: "Show me laptops under ₦2,000,000" or "Phones with good battery"
        </p>
      </form>
    </div>
  );
}
