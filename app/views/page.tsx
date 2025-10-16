"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, TrendingUp, Users, Mail, FileText, DollarSign } from "lucide-react";

export default function ViewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  // Fake analytics data
  const stats = [
    { name: "Total Documents", value: "1,247", change: "+12%", icon: FileText, color: "from-blue-500 to-blue-600" },
    { name: "Emails Synced", value: "892", change: "+8%", icon: Mail, color: "from-purple-500 to-purple-600" },
    { name: "Team Members", value: "24", change: "+2", icon: Users, color: "from-pink-500 to-pink-600" },
    { name: "Revenue Insights", value: "$2.4M", change: "+18%", icon: DollarSign, color: "from-green-500 to-green-600" },
  ];

  const recentActivity = [
    { action: "Gmail sync completed", time: "2 hours ago", count: "47 new emails" },
    { action: "Drive files indexed", time: "4 hours ago", count: "12 documents" },
    { action: "QuickBooks updated", time: "Yesterday", count: "Q4 financials" },
    { action: "HubSpot deals synced", time: "2 days ago", count: "8 active deals" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & Views</h1>
            <p className="text-gray-600">Monitor your company's data and insights</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Growth Chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Data Growth</h2>
              </div>
              <div className="h-64 flex items-end justify-around gap-2">
                {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-purple-600">{activity.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Data Sources</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Gmail", status: "Active", count: "892 emails" },
                { name: "Google Drive", status: "Active", count: "245 files" },
                { name: "QuickBooks", status: "Active", count: "Last sync: 1h ago" },
                { name: "HubSpot", status: "Active", count: "8 deals" },
              ].map((source, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-gray-900">{source.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{source.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

