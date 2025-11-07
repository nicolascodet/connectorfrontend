"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, TrendingUp, TrendingDown,
  List, FileText, AlertCircle, DollarSign, Package, Zap, Calendar
} from "lucide-react";

interface NewsletterInsight {
  type: "stat" | "alert" | "trend" | "list" | "summary";
  title: string;
  priority: "high" | "medium" | "low";
  content: any;
  source_count: number;
  confidence: number;
}

export default function NewsletterDashboard() {
  const [insights, setInsights] = useState<NewsletterInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadNewsletter();
  }, []);

  const loadNewsletter = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 1);

      if (result.insights && result.insights.length > 0) {
        const newsletterData = result.insights[0];
        // Parse structured_data which contains the JSON array of insights
        const parsedInsights = newsletterData.structured_data || [];
        setInsights(parsedInsights);
        setLastUpdated(new Date(newsletterData.generated_at));
      }
    } catch (error) {
      console.error("Failed to load newsletter:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateInsights();
      alert("Newsletter generation started! This will take 45-75 minutes. Refresh the page later to see results.");
    } catch (error) {
      console.error("Failed to trigger generation:", error);
      alert("Failed to start generation.");
    } finally {
      setGenerating(false);
    }
  };

  // Render STAT card (big number with context)
  const renderStat = (insight: NewsletterInsight) => {
    const stat = insight.content.stat;
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">{insight.title}</h3>
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-gray-900">
            {stat.unit === '$' && '$'}{stat.value}{stat.unit && stat.unit !== '$' && stat.unit}
          </span>
          {stat.trend && (
            <span className={`text-sm flex items-center gap-1 ${
              stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {stat.trend === 'down' && <TrendingDown className="w-4 h-4" />}
              {stat.change}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{stat.context}</p>
        <p className="text-xs text-gray-500 mt-3">{insight.source_count} sources • {Math.round(insight.confidence * 100)}% confident</p>
      </div>
    );
  };

  // Render ALERT banner (urgent issue)
  const renderAlert = (insight: NewsletterInsight) => {
    const alert = insight.content.alert;
    const severityColors = {
      critical: 'from-red-50 to-red-100 border-red-200',
      warning: 'from-yellow-50 to-yellow-100 border-yellow-200',
      info: 'from-blue-50 to-blue-100 border-blue-200'
    };
    const severityIcons = {
      critical: <AlertTriangle className="w-6 h-6 text-red-600" />,
      warning: <AlertCircle className="w-6 h-6 text-yellow-600" />,
      info: <FileText className="w-6 h-6 text-blue-600" />
    };

    return (
      <div className={`bg-gradient-to-r ${severityColors[alert.severity as keyof typeof severityColors]} rounded-2xl p-6 border-2`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {severityIcons[alert.severity as keyof typeof severityIcons]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Impact:</span>
                <p className="text-gray-600">{alert.impact}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Action Needed:</span>
                <p className="text-gray-600">{alert.action_needed}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">{insight.source_count} sources</p>
          </div>
        </div>
      </div>
    );
  };

  // Render TREND chart (showing change over time)
  const renderTrend = (insight: NewsletterInsight) => {
    const trend = insight.content.trend;
    const data = trend.data_points || [];
    const maxValue = Math.max(...data.map((p: any) => p.value));

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{insight.title}</h3>
            <p className="text-sm text-gray-600">{trend.insight}</p>
          </div>
          <TrendingUp className={`w-6 h-6 ${
            trend.direction === 'up' ? 'text-green-600' :
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`} />
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-2 h-32 mb-4">
          {data.map((point: any, idx: number) => {
            const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                  style={{ height: `${height}%` }}
                  title={`${point.value}`}
                />
                <span className="text-xs text-gray-500">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500">{insight.source_count} sources • {Math.round(insight.confidence * 100)}% confident</p>
      </div>
    );
  };

  // Render LIST (multiple related items)
  const renderList = (insight: NewsletterInsight) => {
    const list = insight.content.list;
    const items = list.items || [];

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
          <List className="w-5 h-5 text-gray-600" />
        </div>

        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                {item.detail && <p className="text-xs text-gray-600">{item.detail}</p>}
              </div>
              <span className="font-semibold text-gray-900 ml-3">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">{insight.source_count} sources • {Math.round(insight.confidence * 100)}% confident</p>
      </div>
    );
  };

  // Render SUMMARY (text context)
  const renderSummary = (insight: NewsletterInsight) => {
    const summary = insight.content.summary;
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{insight.title}</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{summary.text}</p>
        <p className="text-xs text-gray-500 mt-4">{insight.source_count} sources • {Math.round(insight.confidence * 100)}% confident</p>
      </div>
    );
  };

  // Render insight based on type
  const renderInsight = (insight: NewsletterInsight, index: number) => {
    const key = `${insight.type}-${index}`;

    switch (insight.type) {
      case 'stat':
        return <div key={key}>{renderStat(insight)}</div>;
      case 'alert':
        return <div key={key} className="md:col-span-2">{renderAlert(insight)}</div>;
      case 'trend':
        return <div key={key} className="md:col-span-2">{renderTrend(insight)}</div>;
      case 'list':
        return <div key={key}>{renderList(insight)}</div>;
      case 'summary':
        return <div key={key} className="md:col-span-2">{renderSummary(insight)}</div>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Newsletter Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your first AI-curated daily newsletter. GPT will analyze your emails and decide what matters.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          Generate Newsletter
        </button>
        <p className="text-xs text-gray-500 mt-4">Takes 45-75 minutes</p>
      </div>
    );
  }

  // Group insights by priority
  const highPriority = insights.filter(i => i.priority === 'high');
  const mediumPriority = insights.filter(i => i.priority === 'medium');
  const lowPriority = insights.filter(i => i.priority === 'low');

  return (
    <>
      {/* Newsletter Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Daily Intelligence Newsletter</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {lastUpdated ? lastUpdated.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>{insights.length} insights</span>
          <span>•</span>
          <span>Curated by AI</span>
          <span>•</span>
          <span>Updated {lastUpdated?.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* High Priority (Full Width) */}
      {highPriority.length > 0 && (
        <div className="space-y-6 mb-6">
          {highPriority.map((insight, idx) => renderInsight(insight, idx))}
        </div>
      )}

      {/* Medium Priority (Grid) */}
      {mediumPriority.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {mediumPriority.map((insight, idx) => renderInsight(insight, idx + highPriority.length))}
        </div>
      )}

      {/* Low Priority (Grid) */}
      {lowPriority.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lowPriority.map((insight, idx) => renderInsight(insight, idx + highPriority.length + mediumPriority.length))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100 text-center">
        <p className="text-sm text-gray-700 mb-3">
          This newsletter was curated by AI from {insights.reduce((sum, i) => sum + i.source_count, 0)} source documents
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.href = '/search'}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Search Documents
          </button>
          <button
            onClick={() => window.location.href = '/connections'}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Manage Connections
          </button>
        </div>
      </div>
    </>
  );
}
