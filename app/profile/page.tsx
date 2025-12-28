"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Package,
  User,
  MapPin,
  Heart,
  CreditCard,
  Headphones,
  Settings,
  LogOut,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Support Form State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const router = useRouter();
  // Note: we're client side, so we can use window.location.search inside useEffect if needed,
  // or simple search params if available. For now relying on standard router.
  // Actually, to read query params in "use client" in 13+ app dir we typically use useSearchParams.
  // I'll stick to a simpler useEffect check on window for now to avoid extra imports if not strictly needed,
  // or better, let's use useSearchParams properly.

  // Wait, I need to Import useSearchParams. Let's stick to the cleanest way.

  useEffect(() => {
    // Check for tab param in URL on mount
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (
      tabParam &&
      [
        "orders",
        "details",
        "address",
        "favourites",
        "payment",
        "support",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/login");
        return;
      }
      setUser(data.user);
      loadUserData(data.user.id);
    });
  }, [router]);

  const loadUserData = async (userId: string) => {
    const supabase = createClient();

    // Load orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, items:order_items(*, product:products(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (ordersData) setOrders(ordersData);

    // Load favourites (stored in localStorage for now, can be moved to DB)
    const savedFavourites = localStorage.getItem("favourites");
    if (savedFavourites) {
      try {
        const favIds = JSON.parse(savedFavourites);
        const { data: favProducts } = await supabase
          .from("products")
          .select("*, category:categories(*)")
          .in("id", favIds);
        if (favProducts) setFavourites(favProducts);
      } catch (e) {
        console.error("Error loading favourites:", e);
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setSubmittingTicket(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "User",
          email: user?.email,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit ticket");

      setTicketSuccess(true);
      setTicketSubject("");
      setTicketMessage("");

      // Clear success message after 5 seconds
      setTimeout(() => setTicketSuccess(false), 5000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Failed to submit support ticket. Please try again.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: "orders", label: "Orders", icon: Package },
    { id: "details", label: "Personal Details", icon: User },
    { id: "address", label: "Addresses", icon: MapPin },
    { id: "favourites", label: "Favourites", icon: Heart },
    { id: "payment", label: "Payment Methods", icon: CreditCard },
    { id: "support", label: "Support Ticket", icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
            My Account
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
              <div className="mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm sm:text-base break-words">
                  {user?.email}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {user?.user_metadata?.role === "admin" ? "Admin" : "Customer"}
                </p>
              </div>

              <nav className="space-y-1 sm:space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm ${
                        activeTab === tab.id
                          ? "bg-blue-500 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-medium truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleSignOut}
                className="w-full mt-3 sm:mt-4 flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 min-h-[400px]">
              {activeTab === "orders" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
                    My Orders
                  </h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                        No orders yet
                      </p>
                      <Link
                        href="/products"
                        className="text-blue-500 hover:text-blue-400 text-sm sm:text-base"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div>
                              <p className="text-white font-semibold text-sm sm:text-base">
                                Order #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2">
                              <p className="text-white font-bold text-sm sm:text-base">
                                {formatCurrency(order.total)}
                              </p>
                              <span
                                className={`text-xs sm:text-sm px-2 py-1 rounded ${
                                  order.status === "delivered"
                                    ? "bg-green-900/30 text-green-400"
                                    : order.status === "processing"
                                      ? "bg-blue-900/30 text-blue-400"
                                      : "bg-yellow-900/30 text-yellow-400"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm inline-block"
                          >
                            View Details →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Personal Details
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "address" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Saved Addresses
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <p className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                            Default Address
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            No address saved yet
                          </p>
                        </div>
                        <button className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm flex-shrink-0">
                          Edit
                        </button>
                      </div>
                    </div>
                    <button className="w-full py-2.5 sm:py-3 border border-white/10 rounded-lg text-white hover:bg-gray-800 transition-colors text-sm sm:text-base">
                      + Add New Address
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "favourites" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Favourites
                  </h2>
                  {favourites.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                        No favourites yet
                      </p>
                      <Link
                        href="/products"
                        className="text-blue-500 hover:text-blue-400 text-sm sm:text-base"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {favourites.map((product) => {
                        const mainImage =
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : "https://via.placeholder.com/400x400?text=No+Image";
                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="bg-black rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all group"
                          >
                            <div className="relative aspect-square w-full overflow-hidden bg-gray-900">
                              <Image
                                src={mainImage}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            </div>
                            <div className="p-3 sm:p-4">
                              <p className="text-white font-semibold mb-1 sm:mb-2 text-xs sm:text-sm md:text-base line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
                                {formatCurrency(product.price)}
                              </p>
                              <span className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm inline-flex items-center">
                                View Product →
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payment" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Payment Methods
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10">
                      <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                        No payment methods saved
                      </p>
                      <button className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                        Add Payment Method
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "support" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Support Ticket
                  </h2>

                  {ticketSuccess ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center animate-fade-in">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Ticket Submitted!
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-md mx-auto">
                        Your support ticket has been created successfully. Our
                        team will review it and respond shortly. You can check
                        for updates in the{" "}
                        <span className="text-blue-400">Message Center</span>{" "}
                        (icon in header).
                      </p>
                      <button
                        onClick={() => setTicketSuccess(false)}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Submit Another Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="bg-black rounded-lg p-4 sm:p-6 border border-white/10">
                      <div className="mb-6">
                        <h3 className="text-white font-semibold text-lg mb-2">
                          Create New Ticket
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Please describe your issue in detail. We'll get back
                          to you as soon as possible.
                        </p>
                      </div>

                      <form onSubmit={handleTicketSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            placeholder="e.g., Order #12345 Issue, Refund Request"
                            className="w-full px-4 py-3 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Message Details
                          </label>
                          <textarea
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            placeholder="Please provide as much detail as possible..."
                            rows={6}
                            className="w-full px-4 py-3 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-600"
                            required
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={submittingTicket}
                            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <Headphones className="w-5 h-5" />
                            <span>
                              {submittingTicket
                                ? "Submitting..."
                                : "Submit Ticket"}
                            </span>
                          </button>
                        </div>
                      </form>

                      <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-white font-medium mb-4">
                          Frequently Asked Questions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-blue-400 text-sm font-medium mb-1">
                              When will I get a response?
                            </p>
                            <p className="text-gray-400 text-xs">
                              We typically respond within 24 hours.
                            </p>
                          </div>
                          <div className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-blue-400 text-sm font-medium mb-1">
                              Where can I see my tickets?
                            </p>
                            <p className="text-gray-400 text-xs">
                              Check the Message icon in the top header.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
