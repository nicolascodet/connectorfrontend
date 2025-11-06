"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, TrendingUp, Send, ArrowUpRight, ChevronDown } from "lucide-react";

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
          {/* Top Stats - 3 cards */}
          <div className="grid grid-cols-3 gap-6">
            {/* Revenues */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-6">Documents</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-semibold text-gray-900">---</span>
                <ArrowUpRight className="h-6 w-6 text-blue-500 mb-2" />
              </div>
              <p className="text-sm text-gray-500 mb-6">Increase compared to last week</p>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
                All documents →
              </a>
            </div>

            {/* Lost deals */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-6">Active people</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-semibold text-gray-900">---</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Contacts this week</p>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
                All people →
              </a>
            </div>

            {/* Quarter goal */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-6">Quarter goal</h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3B82F6"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="351.86"
                      strokeDashoffset="56"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-900">--</span>
                  </div>
                </div>
              </div>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
                All goals →
              </a>
            </div>
          </div>

          {/* Main Grid - Customers and Growth */}
          <div className="grid grid-cols-3 gap-6">
            {/* Customers - 2 cols */}
            <div className="col-span-2 bg-white rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span>Sort by Newest</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Empty state */}
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">No customers yet</p>
                <p className="text-sm text-gray-500">Connect your email to see contacts</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <a href="#" className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
                  All customers →
                </a>
              </div>
            </div>

            {/* Growth - 1 col */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Growth</h3>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span>Yearly</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Chart placeholder */}
              <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-12 w-12 text-blue-300" />
              </div>

              {/* Bottom stats */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Top month</p>
                  <p className="text-2xl font-semibold text-blue-500 mb-1">November</p>
                  <p className="text-sm text-gray-500">2019</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Top year</p>
                  <p className="text-2xl font-semibold text-blue-500 mb-1">2023</p>
                  <p className="text-sm text-gray-500">96K sold so far</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Top buyer</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-500">---</p>
                      <p className="text-xs text-gray-500">No data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid - Chats, Top states, New deals */}
          <div className="grid grid-cols-3 gap-6">
            {/* Chats */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chats</h3>
              <p className="text-sm text-gray-500 mb-6">2 unread messages</p>

              {/* Avatar row */}
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full border-2 border-white"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full border-2 border-white"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
              </div>
            </div>

            {/* Top states */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top states</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">NY</span>
                  <span className="text-sm font-semibold text-gray-900">120K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">MA</span>
                  <span className="text-sm font-semibold text-gray-900">80K</span>
                </div>
              </div>
            </div>

            {/* New deals */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">New deals</h3>

              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> Fruit2Go
                </button>
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> Marshall's MKT
                </button>
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> CCNT
                </button>
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <span className="text-lg">+</span> Joana Mini-market
                </button>
              </div>
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
