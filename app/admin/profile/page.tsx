"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Package, User, Settings, BarChart3, LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.user_metadata?.role !== "admin") {
        router.push("/auth/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "details", label: "Personal Details", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
            Admin Profile
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage your admin account and settings
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
                  Administrator
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

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                <Link
                  href="/superb/admin/access/account"
                  className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
              </div>

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
            <div className="bg-gray-900 rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Overview
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">
                        Total Products
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        -
                      </p>
                    </div>
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">
                        Total Orders
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        -
                      </p>
                    </div>
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10 sm:col-span-2 md:col-span-1">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">
                        Revenue
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        -
                      </p>
                    </div>
                  </div>
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
                    <button className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                    Settings
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-black rounded-lg p-4 sm:p-5 md:p-6 border border-white/10">
                      <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                        Notifications
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                        Manage your notification preferences
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center text-white text-xs sm:text-sm">
                          <input
                            type="checkbox"
                            className="mr-2 w-4 h-4"
                            defaultChecked
                          />
                          Email notifications
                        </label>
                        <label className="flex items-center text-white text-xs sm:text-sm">
                          <input
                            type="checkbox"
                            className="mr-2 w-4 h-4"
                            defaultChecked
                          />
                          Order updates
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
