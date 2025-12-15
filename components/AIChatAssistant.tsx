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
        "Hi! I'm your AI shopping assistant. 👋\n\nI can help you find the perfect products! Just tell me what you're looking for - for example:\n• \"I need a laptop for video editing under $2000\"\n• \"Show me gifts for my mom who loves cooking\"\n• \"What do you have for a home office?\"\n\nWhat can I help you find today?",
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] md:h-[700px] bg-black border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">
              AI Shopping Assistant
            </h3>
            <p className="text-xs text-gray-400">Always here to help!</p>
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
          Try: "Show me laptops under $2000" or "Gifts for cooking enthusiasts"
        </p>
      </form>
    </div>
  );
}

