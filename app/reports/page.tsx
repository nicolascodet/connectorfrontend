"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Star,
  Trash2,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
  AlertTriangle,
  TrendingUp,
  Clock
} from "lucide-react";
import { listReports, toggleReportStar, deleteReport, getReport } from "@/lib/api";
import DrillDownModal from "@/components/dashboard/DrillDownModal";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";

interface SavedReport {
  report_id: number;
  title: string;
  report_type: string;
  description: string | null;
  created_at: string;
  last_viewed_at: string | null;
  view_count: number;
  is_starred: boolean;
  tags: string[];
  source_widget_title: string | null;
  source_alert_id: number | null;
  report_summary: string | null;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadReports();
  }, [filterType, starredOnly]);

  const loadReports = async () => {
    // Hardcoded fake reports for demo
    const fakeReports: SavedReport[] = [
      {
        report_id: 1,
        title: "Q4 Revenue Analysis",
        report_type: "widget_drilldown",
        description: "Comprehensive analysis of Q4 revenue trends and key customer segments",
        created_at: "2025-11-05T14:30:00Z",
        last_viewed_at: "2025-11-07T10:15:00Z",
        view_count: 12,
        is_starred: true,
        tags: ["revenue", "quarterly", "analysis"],
        source_widget_title: "Revenue Trends",
        source_alert_id: null,
        report_summary: "Q4 revenue shows 23% growth driven by enterprise accounts. Key accounts: TechCorp ($2.5M), ManuCo ($1.8M). Risk: 3 accounts delayed payments totaling $450K."
      },
      {
        report_id: 2,
        title: "Customer Churn Investigation",
        report_type: "alert_investigation",
        description: "Deep dive into elevated customer churn rate in manufacturing segment",
        created_at: "2025-11-06T09:45:00Z",
        last_viewed_at: "2025-11-06T16:20:00Z",
        view_count: 8,
        is_starred: false,
        tags: ["churn", "customers", "risk"],
        source_widget_title: "Customer Complaints Rising",
        source_alert_id: 15,
        report_summary: "Churn rate increased to 8.2% (up from 5.1%). Root cause: delivery delays affecting 15 key accounts. Recommended actions: expedite shipments, implement weekly status calls."
      },
      {
        report_id: 3,
        title: "Supply Chain Bottlenecks",
        report_type: "widget_drilldown",
        description: "Analysis of operational blockers impacting production timelines",
        created_at: "2025-11-04T11:20:00Z",
        last_viewed_at: "2025-11-07T08:30:00Z",
        view_count: 15,
        is_starred: true,
        tags: ["operations", "supply-chain", "production"],
        source_widget_title: "Engineering Review Bottleneck",
        source_alert_id: null,
        report_summary: "3 major bottlenecks identified: 1) Material shortages from supplier bankruptcy, 2) Quality control backlog (avg 5 days), 3) Shipping delays to aerospace customers. Estimated $1.2M revenue at risk."
      }
    ];

    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setReports(fakeReports);
    setLoading(false);
  };

  const handleToggleStar = async (reportId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await toggleReportStar(reportId);
      // Update local state
      setReports(reports.map(r =>
        r.report_id === reportId ? { ...r, is_starred: !r.is_starred } : r
      ));
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const handleDelete = async (reportId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await deleteReport(reportId);
      setReports(reports.filter(r => r.report_id !== reportId));
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("Failed to delete report");
    }
  };

  const handleViewReport = async (report: SavedReport) => {
    try {
      const result = await getReport(report.report_id);
      setSelectedReport({
        title: report.title,
        message: report.source_widget_title || report.title,
        report: result.report.report_data
      });
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to load report:", error);
      alert("Failed to load report");
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "widget_drilldown": return "Widget Analysis";
      case "alert_investigation": return "Alert Investigation";
      case "manual_query": return "Manual Query";
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "widget_drilldown": return "bg-blue-100 text-blue-800 border-blue-200";
      case "alert_investigation": return "bg-red-100 text-red-800 border-red-200";
      case "manual_query": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredReports = reports.filter(report => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        report.title.toLowerCase().includes(search) ||
        report.description?.toLowerCase().includes(search) ||
        report.report_summary?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="flex">
      <Sidebar user={user} />
      <div className="flex-1 min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Saved Reports</h1>
            <p className="text-gray-600">Access your saved intelligence reports</p>
          </div>
          <button
            onClick={() => router.push("/dash")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType || ""}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="widget_drilldown">Widget Analysis</option>
              <option value="alert_investigation">Alert Investigation</option>
              <option value="manual_query">Manual Query</option>
            </select>

            {/* Starred Filter */}
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                starredOnly
                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                  : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200"
              }`}
            >
              <Star className={`w-5 h-5 inline mr-2 ${starredOnly ? "fill-yellow-500" : ""}`} />
              {starredOnly ? "Starred Only" : "Show All"}
            </button>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Reports Found</h3>
            <p className="text-gray-500 mb-8">
              {searchTerm
                ? "No reports match your search"
                : starredOnly
                ? "You haven't starred any reports yet"
                : "Save drill-down reports to access them here"}
            </p>
            <button
              onClick={() => router.push("/dash")}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.report_id}
                onClick={() => handleViewReport(report)}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getReportTypeColor(report.report_type)}`}>
                      {getReportTypeLabel(report.report_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStar(report.report_id, e)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Star className={`w-5 h-5 ${report.is_starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(report.report_id, e)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Summary */}
                {report.report_summary && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {report.report_summary}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(report.created_at)}
                  </span>
                  {report.view_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {report.view_count} views
                    </span>
                  )}
                </div>

                {/* Tags */}
                {report.tags && report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {report.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && filteredReports.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
          </div>
        )}
      </div>

        {/* Report Modal */}
        {selectedReport && (
          <DrillDownModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedReport(null);
            }}
            widgetTitle={selectedReport.title}
            widgetMessage={selectedReport.message}
            preloadedReport={selectedReport.report}
          />
        )}
        </div>
      </div>
    </div>
  );
}
