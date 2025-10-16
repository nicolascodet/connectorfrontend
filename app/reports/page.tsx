"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, FileText, Sparkles, Download, Calendar, Users, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
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

  const reportTemplates = [
    {
      name: "Team Performance",
      icon: Users,
      description: "Analyze team productivity, email volume, and collaboration metrics",
      color: "from-blue-500 to-blue-600",
      dataPoints: ["Email activity", "Response times", "Meeting frequency"],
    },
    {
      name: "Revenue Insights",
      icon: DollarSign,
      description: "Financial overview with deal tracking and revenue projections",
      color: "from-green-500 to-green-600",
      dataPoints: ["Pipeline value", "Closed deals", "Revenue trends"],
    },
    {
      name: "Growth Metrics",
      icon: TrendingUp,
      description: "Track company growth across all connected data sources",
      color: "from-purple-500 to-purple-600",
      dataPoints: ["Customer acquisition", "Data volume", "System usage"],
    },
    {
      name: "Custom Report",
      icon: Sparkles,
      description: "AI-powered custom reports based on your specific needs",
      color: "from-pink-500 to-pink-600",
      dataPoints: ["Your choice", "AI-suggested insights", "Flexible format"],
    },
  ];

  const recentReports = [
    { name: "Q4 2024 Team Summary", date: "2 days ago", format: "PDF" },
    { name: "October Revenue Report", date: "1 week ago", format: "Excel" },
    { name: "Sales Pipeline Analysis", date: "2 weeks ago", format: "PDF" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">Reports</h1>
            </div>
            <p className="text-gray-600">Auto-generate insights and reports from your company data</p>
          </div>

          {/* AI-Powered Banner */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">AI-Powered Report Generation</h2>
                <p className="text-white/90 mb-4">
                  Our AI analyzes all your connected data sources (emails, documents, CRM, financials) to generate 
                  comprehensive reports tailored to your needs. No manual data gathering required.
                </p>
                <Button className="bg-white text-purple-600 hover:bg-white/90">
                  Generate New Report
                </Button>
              </div>
            </div>
          </div>

          {/* Report Templates */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportTemplates.map((template, i) => {
                const Icon = template.icon;
                return (
                  <div
                    key={i}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Includes:</div>
                      {template.dataPoints.map((point, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          {point}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4 bg-gray-100 text-gray-900 hover:bg-gray-200 border-0">
                      Generate Report
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <Button variant="ghost" className="text-sm text-purple-600 hover:text-purple-700">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentReports.map((report, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.date} • {report.format}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Scheduled Reports</h3>
              <p className="text-sm text-gray-600">Set up automatic report generation on a daily, weekly, or monthly schedule</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Team Reports</h3>
              <p className="text-sm text-gray-600">Generate department-specific reports with filtered data access and permissions</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Insights</h3>
              <p className="text-sm text-gray-600">Get AI-generated insights and recommendations based on your data trends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

