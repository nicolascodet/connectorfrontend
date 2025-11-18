"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Star,
  Trash2,
  Search,
  Calendar,
  Eye,
} from "lucide-react";
import { listReports, toggleReportStar, deleteReport, getReport } from "@/lib/api";
import DrillDownModal from "@/components/dashboard/DrillDownModal";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    try {
      setLoading(true);
      const result = await listReports(filterType || undefined, starredOnly);
      setReports(result.reports || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (reportId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await toggleReportStar(reportId);
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
      window.alert("Failed to delete report");
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
      window.alert("Failed to load report");
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

  const getReportTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "widget_drilldown": return "default";
      case "alert_investigation": return "destructive";
      case "manual_query": return "secondary";
      default: return "outline";
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

  const filteredReports = reports.filter((report) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        report.title.toLowerCase().includes(search) ||
        (report.description && report.description.toLowerCase().includes(search)) ||
        (report.report_summary && report.report_summary.toLowerCase().includes(search))
      );
    }
    return true;
  });

  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-normal mb-2">Saved Reports</h1>
              <p className="text-muted-foreground font-light">Access your saved intelligence reports</p>
            </div>
            <Button onClick={() => router.push("/")} className="font-normal">
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType || "all"} onValueChange={(value) => setFilterType(value === "all" ? null : value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="widget_drilldown">Widget Analysis</SelectItem>
                    <SelectItem value="alert_investigation">Alert Investigation</SelectItem>
                    <SelectItem value="manual_query">Manual Query</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={starredOnly ? "default" : "outline"}
                  onClick={() => setStarredOnly(!starredOnly)}
                >
                  <Star className={`w-4 h-4 mr-2 ${starredOnly ? "fill-current" : ""}`} />
                  {starredOnly ? "Starred Only" : "Show All"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-16 text-center">
              <FileText className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-normal mb-3">No Reports Found</h3>
              <p className="text-muted-foreground font-light mb-8 text-base">
                {searchTerm
                  ? "No reports match your search"
                  : starredOnly
                  ? "You haven't starred any reports yet"
                  : "Save drill-down reports to access them here"}
              </p>
              <Button onClick={() => router.push("/")} className="font-normal">
                Go to Dashboard
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card
                  key={report.report_id}
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => handleViewReport(report)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {report.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleStar(report.report_id, e)}
                          className="h-8 w-8"
                        >
                          <Star className={`h-4 w-4 ${report.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(report.report_id, e)}
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant={getReportTypeVariant(report.report_type)}>
                      {getReportTypeLabel(report.report_type)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {report.report_summary && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {report.report_summary}
                      </p>
                    )}
                    {report.tags && report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {report.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground flex items-center gap-4">
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
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredReports.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
            </div>
          )}

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
