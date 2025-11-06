"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, TrendingUp, Users, FileText, Mail, Send, ArrowUpRight, Plus } from "lucide-react";
import { Card, AreaChart, BarList } from "@tremor/react";

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
        <div className="flex-1 flex justify-center items-center bg-white">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Placeholder data structure (empty for now)
  const topPeople = [];
  const recentActivity = [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto p-8">
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Documents */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500">Loading data...</p>
                </div>
              </div>
            </Card>

            {/* Active People */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Active People</p>
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">---</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
              </div>
            </Card>

            {/* Quarter Goal */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Quarter goal</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="201"
                        strokeDashoffset="50"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">--</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 hover:underline cursor-pointer">All goals →</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* People / Customers (2 cols) */}
            <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">People</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sort by Newest</span>
                </div>
              </div>
              {topPeople.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No people data yet</p>
                  <p className="text-xs text-gray-400 mt-1">Connect your email to see contacts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Will show people list here */}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a href="#" className="text-sm text-blue-600 hover:underline">All people →</a>
              </div>
            </Card>

            {/* Growth Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Growth</h3>
                <span className="text-xs text-gray-500">Yearly</span>
              </div>
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No data yet</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Top month</p>
                  <p className="text-base font-semibold text-blue-600">---</p>
                  <p className="text-xs text-gray-400">2025</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Top year</p>
                  <p className="text-base font-semibold text-blue-600">---</p>
                  <p className="text-xs text-gray-400">-- so far</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Top contact</p>
                  <p className="text-base font-semibold text-blue-600">---</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity / Top States */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Top sources</h3>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">Data will appear here once you sync</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Will show activity here */}
                </div>
              )}
            </Card>

            {/* New Items */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Recent documents</h3>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No recent documents</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Glassmorphism Chat Bar - Fixed at Bottom */}
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
                    placeholder="Ask anything about your documents, emails, or knowledge base..."
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
