"use client";

import { useEffect, useState } from "react";
import { getSentimentAnalysis } from "@/lib/api";
import { AlertCircle, Loader2, ThumbsUp, ThumbsDown, Lightbulb, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Alert {
  type: "positive" | "negative" | "opportunity" | "risk";
  keyword: string;
  count: number;
  context?: string;
  severity?: "low" | "medium" | "high";
}

export default function SentimentAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getSentimentAnalysis(30);
      setAlerts(result.alerts || []);
    } catch (err) {
      console.error("Failed to load sentiment analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = (keyword: string) => {
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      case "opportunity":
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case "risk":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      case "opportunity":
        return "bg-blue-50 border-blue-200";
      case "risk":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-700";
      case "negative":
        return "text-red-700";
      case "opportunity":
        return "text-blue-700";
      case "risk":
        return "text-amber-700";
      default:
        return "text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Sentiment & Alerts</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const positiveAlerts = alerts.filter(a => a.type === "positive");
  const negativeAlerts = alerts.filter(a => a.type === "negative");
  const opportunityAlerts = alerts.filter(a => a.type === "opportunity");
  const riskAlerts = alerts.filter(a => a.type === "risk");

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Sentiment & Alerts</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No sentiment data available yet</p>
          <p className="text-xs text-gray-400 mt-1">Sentiment analysis runs daily on your communications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Opportunity Alerts */}
          {opportunityAlerts.slice(0, 2).map((alert, idx) => (
            <button
              key={`opp-${idx}`}
              onClick={() => handleAlertClick(alert.keyword)}
              className={`w-full p-3 rounded-xl border ${getAlertColor(alert.type)} hover:shadow-sm transition-all group text-left`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getTextColor(alert.type)} mb-0.5`}>
                      "{alert.keyword}" mentioned {alert.count} times
                    </p>
                    {alert.context && (
                      <p className="text-xs text-gray-600">{alert.context}</p>
                    )}
                  </div>
                </div>
                <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}

          {/* Risk Alerts */}
          {riskAlerts.slice(0, 2).map((alert, idx) => (
            <button
              key={`risk-${idx}`}
              onClick={() => handleAlertClick(alert.keyword)}
              className={`w-full p-3 rounded-xl border ${getAlertColor(alert.type)} hover:shadow-sm transition-all group text-left`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getTextColor(alert.type)} mb-0.5`}>
                      "{alert.keyword}" mentioned {alert.count} times
                    </p>
                    {alert.context && (
                      <p className="text-xs text-gray-600">{alert.context}</p>
                    )}
                  </div>
                </div>
                <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}

          {/* Positive Alerts */}
          {positiveAlerts.slice(0, 1).map((alert, idx) => (
            <button
              key={`pos-${idx}`}
              onClick={() => handleAlertClick(alert.keyword)}
              className={`w-full p-3 rounded-xl border ${getAlertColor(alert.type)} hover:shadow-sm transition-all group text-left`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getTextColor(alert.type)} mb-0.5`}>
                      "{alert.keyword}" mentioned {alert.count} times
                    </p>
                    {alert.context && (
                      <p className="text-xs text-gray-600">{alert.context}</p>
                    )}
                  </div>
                </div>
                <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}

          {/* Negative Alerts */}
          {negativeAlerts.slice(0, 1).map((alert, idx) => (
            <button
              key={`neg-${idx}`}
              onClick={() => handleAlertClick(alert.keyword)}
              className={`w-full p-3 rounded-xl border ${getAlertColor(alert.type)} hover:shadow-sm transition-all group text-left`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getTextColor(alert.type)} mb-0.5`}>
                      "{alert.keyword}" mentioned {alert.count} times
                    </p>
                    {alert.context && (
                      <p className="text-xs text-gray-600">{alert.context}</p>
                    )}
                  </div>
                </div>
                <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          AI-detected sentiment from last 30 days • Click to investigate
        </p>
      </div>
    </div>
  );
}
