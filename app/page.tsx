"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, Send } from "lucide-react";
import ActivityPulse from "@/components/dashboard/ActivityPulse";
import IntelligenceFeed from "@/components/dashboard/IntelligenceFeed";
import TrendingEntities from "@/components/dashboard/TrendingEntities";
import DealMomentum from "@/components/dashboard/DealMomentum";
import SentimentAlerts from "@/components/dashboard/SentimentAlerts";
import CommunicationPatterns from "@/components/dashboard/CommunicationPatterns";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");

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
        <div className="max-w-[1600px] mx-auto p-8 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Business Intelligence</h1>
            <p className="text-gray-600">Real-time insights from your connected data sources</p>
          </div>

          {/* Top Row - Activity Pulse + Intelligence Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityPulse />
            <IntelligenceFeed />
          </div>

          {/* Second Row - Trending Entities (Full Width) */}
          <div className="grid grid-cols-1 gap-6">
            <TrendingEntities />
          </div>

          {/* Third Row - Deal Momentum + Sentiment Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DealMomentum />
            <SentimentAlerts />
          </div>

          {/* Fourth Row - Communication Patterns (Full Width) */}
          <div className="grid grid-cols-1 gap-6">
            <CommunicationPatterns />
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => router.push('/search')}
                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Search Documents
              </button>
              <button
                onClick={() => router.push('/connections')}
                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Manage Connections
              </button>
              <button
                onClick={() => router.push('/search?q=summarize this week')}
                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Weekly Summary
              </button>
            </div>
          </div>
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
