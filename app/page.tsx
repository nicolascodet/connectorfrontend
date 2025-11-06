"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, TrendingUp, Users, FileText, Mail, Send } from "lucide-react";
import { Card, AreaChart, DonutChart, BarList } from "@tremor/react";

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
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(chatInput)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Your enterprise knowledge intelligence overview</p>
          </div>

          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Documents */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Documents</p>
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            {/* Emails Synced */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Emails Synced</p>
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            {/* Active People */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active People</p>
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            {/* Growth */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Week</p>
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Over Time */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No data yet</p>
                </div>
              </div>
            </Card>

            {/* Top People */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top People</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity data yet</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="text-center py-12 text-gray-400">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Connect your data sources to see activity</p>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Documents Today</p>
                  <p className="text-2xl font-bold text-gray-900">---</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Companies</p>
                  <p className="text-2xl font-bold text-gray-900">---</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Knowledge Graph Entities</p>
                  <p className="text-2xl font-bold text-gray-900">---</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Glassmorphism Chat Bar - Fixed at Bottom */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50">
        <div className="w-full max-w-3xl">
          <form onSubmit={handleChatSubmit}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50">
                <div className="flex items-center gap-3 p-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything about your documents, emails, or knowledge base..."
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p className="text-center text-xs text-gray-500 mt-2">
            Powered by CORTEX • RAG Search across all your connected data
          </p>
        </div>
      </div>
    </div>
  );
}
