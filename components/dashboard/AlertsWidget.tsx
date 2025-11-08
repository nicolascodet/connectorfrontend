"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, BellOff, X, Search, Clock, TrendingUp } from "lucide-react";
import { getActiveAlerts, dismissAlert, investigateAlert } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

interface AlertsWidgetProps {
  onInvestigate: (alertId: number, summary: string) => void;
  investigating?: boolean;
}

export default function AlertsWidget({ onInvestigate, investigating }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<number | null>(null);

  useEffect(() => {
    loadAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const result = await getActiveAlerts(undefined, 10);
      setAlerts(result.alerts || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: number) => {
    try {
      setDismissing(alertId);
      await dismissAlert(alertId);

      // Remove from list
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
      alert("Failed to dismiss alert");
    } finally {
      setDismissing(null);
    }
  };

  const handleInvestigate = (alert: Alert) => {
    onInvestigate(alert.alert_id, alert.summary);
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BellOff className="w-6 h-6 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900">Alerts</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 font-normal">All clear!</p>
            <p className="text-sm text-gray-500 font-light mt-2">No urgent items detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-red-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-semibold">
              {alerts.length}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Active Alerts</h2>
        </div>
        <button
          onClick={loadAlerts}
          className="text-sm text-blue-600 hover:text-blue-700 font-normal"
        >
          Refresh
        </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Alerts List */}
        <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className={`rounded-2xl border-2 p-5 transition-all hover:shadow-md ${getUrgencyColor(alert.urgency_level)}`}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getUrgencyIndicator(alert.urgency_level)}`}></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {getAlertTypeLabel(alert.alert_type)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-light flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(alert.detected_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 leading-relaxed font-normal">
                  {alert.summary}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(alert.alert_id)}
                disabled={dismissing === alert.alert_id}
                className="ml-3 p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                title="Dismiss alert"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Key Entities */}
            {alert.key_entities && alert.key_entities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {alert.key_entities.slice(0, 3).map((entity, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white rounded-lg text-xs font-normal text-gray-700 border border-gray-200"
                  >
                    {entity}
                  </span>
                ))}
                {alert.key_entities.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500 font-light">
                    +{alert.key_entities.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleInvestigate(alert)}
                className="flex-1 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-normal text-sm transition-colors border border-blue-200 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Investigate
              </button>
              {alert.investigation_count > 0 && (
                <span className="text-xs text-gray-500 font-light flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Viewed {alert.investigation_count}x
                </span>
              )}
            </div>
          </div>
        ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Real-time intelligence • Updates every 30 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
