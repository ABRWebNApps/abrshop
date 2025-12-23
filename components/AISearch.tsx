"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    // Trigger chatbot to open and search instead of redirecting
    const chatButton = document.querySelector('[aria-label="Open Athena AI Assistant"]') as HTMLButtonElement;
    if (chatButton) {
      chatButton.click();
      // Wait a bit for chat to open, then trigger search
      setTimeout(() => {
        // Dispatch custom event to trigger search in chatbot
        window.dispatchEvent(new CustomEvent('chatbot-search', { detail: { query: query.trim() } }));
      }, 500);
    } else {
      // Fallback: if chatbot button not found, use old behavior
      setLoading(true);
      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Search failed with status ${response.status}`;
          console.error("API Error:", errorMessage);
          throw new Error(errorMessage);
        }

        const { productIds } = await response.json();

        // Navigate to products page with AI search results
        if (productIds && productIds.length > 0) {
          // Store product IDs in sessionStorage for the products page to use
          sessionStorage.setItem("aiSearchResults", JSON.stringify(productIds));
          router.push(`/products?ai_search=true`);
        } else {
          // No results found, still navigate but show a message
          router.push(`/products?search=${encodeURIComponent(query)}`);
        }
      } catch (error: any) {
        console.error("Error searching:", error);
        // Show user-friendly error message
        alert(`Search error: ${error.message || "Please try again or use regular search"}`);
        // Fallback to regular search
        router.push(`/products?search=${encodeURIComponent(query)}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickSearch = (quickQuery: string) => {
    setQuery(quickQuery);
    // Trigger search after setting query
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center bg-gray-900 rounded-full border border-white/10 p-3 md:p-4">
          <span className="text-gray-400 mr-2 md:mr-3 text-sm md:text-base">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: 'Professional laptop for video editing under ₦2,000,000'..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm md:text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="ml-2 md:ml-4 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </button>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6">
        <button
          onClick={() => handleQuickSearch("Titanium Watch")}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors"
        >
          Titanium Watch
        </button>
        <button
          onClick={() => handleQuickSearch("Noise Cancelling")}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors"
        >
          Noise Cancelling
        </button>
        <button
          onClick={() => handleQuickSearch("Gaming Setup")}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors"
        >
          Gaming Setup
        </button>
        <button
          onClick={() => handleQuickSearch("4K Monitors")}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors"
        >
          4K Monitors
        </button>
      </div>
    </div>
  );
}

