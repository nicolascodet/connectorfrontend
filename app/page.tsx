"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, Send } from "lucide-react";
import ManufacturingDashboard from "@/components/dashboard/ManufacturingDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(chatInput)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-[1800px] mx-auto p-6 space-y-6">
          {/* Header with Time Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Unit Industries Manufacturing Intelligence
              </h1>
              <p className="text-gray-600">
                AI-powered insights from your production operations
              </p>
            </div>

            {/* Time Period Tabs */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setTimePeriod("daily")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  timePeriod === "daily"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimePeriod("weekly")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  timePeriod === "weekly"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimePeriod("monthly")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  timePeriod === "monthly"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Manufacturing Dashboard */}
          <ManufacturingDashboard timePeriod={timePeriod} />
        </div>
      </div>

      {/* Glassmorphism Chat Bar */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto">
          <form onSubmit={handleChatSubmit}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50">
                <div className="flex items-center gap-3 p-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything about your business, documents, or data..."
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            Powered by HighForce
          </p>
        </div>
      </div>
    </div>
  );
}
