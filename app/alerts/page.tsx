"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Eye,
  X,
  Clock,
  TrendingUp,
  BellOff
} from "lucide-react";
import { getActiveAlerts, dismissAlert, investigateAlert } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";
import DrillDownModal from "@/components/dashboard/DrillDownModal";

interface Alert {
  alert_id: number;
  document_id: number;
  document_title: string;
  document_source: string;
  alert_type: string;
  urgency_level: string;
  summary: string;
  key_entities: string[];
  detected_at: string;
  investigation_count: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadAlerts();
  }, [filterUrgency, filterType]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const result = await getActiveAlerts(filterUrgency || undefined, 100);
      setAlerts(result.alerts || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to dismiss this alert?")) return;

    try {
      setDismissing(alertId);
      await dismissAlert(alertId);
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
      alert("Failed to dismiss alert");
    } finally {
      setDismissing(null);
    }
  };

  const handleInvestigate = async (alert: Alert) => {
    try {
      const result = await investigateAlert(alert.alert_id);
      setSelectedAlert({
        title: `Alert: ${alert.alert_type}`,
        message: alert.summary,
        report: result.report
      });
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to investigate alert:", error);
      alert("Failed to investigate alert");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getUrgencyIndicator = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        alert.summary.toLowerCase().includes(search) ||
        alert.document_title.toLowerCase().includes(search) ||
        alert.key_entities.some(entity => entity.toLowerCase().includes(search))
      );
    }
    if (filterType && alert.alert_type !== filterType) {
      return false;
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Alerts</h1>
              <p className="text-gray-600">Monitor and investigate urgent items</p>
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
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Urgency Filter */}
              <select
                value={filterUrgency || ""}
                onChange={(e) => setFilterUrgency(e.target.value || null)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType || ""}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="revenue_risk">Revenue Risk</option>
                <option value="customer_issue">Customer Issue</option>
                <option value="operational_blocker">Operational Blocker</option>
                <option value="strategic_opportunity">Strategic Opportunity</option>
                <option value="competitive_threat">Competitive Threat</option>
              </select>

              <button
                onClick={loadAlerts}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
              <BellOff className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Alerts Found</h3>
              <p className="text-gray-500 mb-8">
                {searchTerm
                  ? "No alerts match your search"
                  : "All clear! No urgent items detected"}
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
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => handleInvestigate(alert)}
                  className={`rounded-2xl border-2 p-6 hover:shadow-lg transition-all cursor-pointer group ${getUrgencyColor(alert.urgency_level)}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getUrgencyIndicator(alert.urgency_level)}`}></div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {alert.document_title}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(alert.alert_id, e)}
                      disabled={dismissing === alert.alert_id}
                      className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {alert.summary}
                  </p>

                  {/* Key Entities */}
                  {alert.key_entities && alert.key_entities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {alert.key_entities.slice(0, 3).map((entity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200"
                        >
                          {entity}
                        </span>
                      ))}
                      {alert.key_entities.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{alert.key_entities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(alert.detected_at)}
                    </span>
                    {alert.investigation_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {alert.investigation_count} views
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Footer */}
          {!loading && filteredAlerts.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500">
              Showing {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerts"}
            </div>
          )}
        </div>

        {/* Investigation Modal */}
        {selectedAlert && (
          <DrillDownModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedAlert(null);
            }}
            widgetTitle={selectedAlert.title}
            widgetMessage={selectedAlert.message}
            preloadedReport={selectedAlert.report}
          />
        )}
      </div>
    </div>
  );
}
