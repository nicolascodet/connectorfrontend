"use client";

import { useEffect, useState } from "react";
import { getLatestInsights } from "@/lib/api";
import {
  Calendar, TrendingUp, Users, AlertCircle, Zap,
  ChevronRight, ExternalLink, RefreshCw
} from "lucide-react";

interface SourceDocument {
  node_id?: string;
  text: string;
  score: number;
  metadata?: any;
}

interface Insight {
  category: string;
  title: string;
  icon?: string;
  answer: string;
  confidence?: number;
  sources: SourceDocument[];
  total_sources: number;
  generated_at: string;
}

// Map icon names to components
const iconMap: Record<string, any> = {
  calendar: Calendar,
  "trending-up": TrendingUp,
  users: Users,
  "alert-circle": AlertCircle,
  zap: Zap,
};

export default function DashboardPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getLatestInsights("daily", 5);
      setInsights(result.insights || []);
    } catch (err) {
      console.error("Failed to load insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading business intelligence...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-red-900 font-medium">Failed to load insights</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={loadInsights}
                  className="mt-3 text-sm text-red-700 hover:text-red-900 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No insights yet</h2>
            <p className="text-gray-600 mb-6">
              Business intelligence insights will appear here once they're generated from your documents.
            </p>
            <p className="text-sm text-gray-500">
              Run the nightly insight generation job to populate this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
              <p className="text-gray-600 mt-1">AI-generated insights from your documents</p>
            </div>
            <button
              onClick={loadInsights}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="space-y-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon ? iconMap[insight.icon] || Calendar : Calendar;
            const isExpanded = expandedInsight === index;

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Insight Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Generated {new Date(insight.generated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {insight.confidence && (
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">Confidence</div>
                        <div className="text-sm font-semibold text-green-600">
                          {Math.round(insight.confidence * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insight Answer */}
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{insight.answer}</p>
                </div>

                {/* Sources Section */}
                {insight.total_sources > 0 && (
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => setExpandedInsight(isExpanded ? null : index)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <span>
                        {isExpanded ? "Hide" : "View"} {insight.total_sources} source{insight.total_sources > 1 ? "s" : ""}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        {insight.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-xs font-medium text-gray-500">
                                Source {idx + 1}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-xs text-gray-500">Relevance</div>
                                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                  {Math.round(source.score * 100)}%
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {source.text}
                            </p>
                            {source.metadata && (
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                {source.metadata.source && (
                                  <span>Source: {source.metadata.source}</span>
                                )}
                                {source.metadata.created_at && (
                                  <span>Date: {new Date(source.metadata.created_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/search"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Search Documents</div>
                <div className="text-sm text-gray-500">Find specific information</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </a>

            <a
              href="/connections"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Manage Connections</div>
                <div className="text-sm text-gray-500">Sync more data sources</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </a>

            <button
              onClick={loadInsights}
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Refresh Insights</div>
                <div className="text-sm text-gray-500">Get latest analysis</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
