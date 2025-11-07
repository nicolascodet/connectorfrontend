"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, TrendingUp, AlertCircle,
  ArrowUp, ArrowDown, Minus, Activity, DollarSign
} from "lucide-react";

interface Widget {
  widget_type: string;
  title: string;
  message: string;
  urgency: string;
  sources: Array<{
    quote: string;
    document_id: string;
    from: string;
  }>;
}

interface Insight {
  category: string;
  title: string;
  structured_data: Widget[];
}

export default function CleanBusinessDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 10);

      if (result.insights && result.insights.length > 0) {
        const parsed = result.insights.map((insight: any) => {
          let structured_data = insight.structured_data || [];
          if (typeof structured_data === 'string') {
            try {
              structured_data = JSON.parse(structured_data);
            } catch (e) {
              structured_data = [];
            }
          }
          return {
            category: insight.category,
            title: insight.title,
            structured_data
          };
        });
        setInsights(parsed);
      }
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateInsights();
      alert("Generating insights... Takes 45-75 minutes. Refresh later.");
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSourceClick = (documentId: string) => {
    router.push(`/sources/${documentId}`);
  };

  // Flatten all widgets
  const allWidgets: Widget[] = [];
  insights.forEach(insight => {
    if (Array.isArray(insight.structured_data)) {
      insight.structured_data.forEach(widget => {
        allWidgets.push(widget);
      });
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (allWidgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate AI-powered business insights from your communications.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          Generate Insights
        </button>
        <p className="text-xs text-gray-500 mt-4">Takes 45-75 minutes</p>
      </div>
    );
  }

  // Render different widget types
  const renderWidget = (widget: Widget, idx: number) => {
    const baseClasses = "bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow";

    // Widget type: stat (big number card)
    if (widget.widget_type === 'stat') {
      const messageParts = (widget.message || '').split(' ');
      const bigNumber = messageParts[0] || '';
      const description = messageParts.slice(1).join(' ') || widget.message;

      return (
        <div key={idx} className={baseClasses}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {widget.title || 'Metric'}
            </h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {bigNumber}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
          {renderSources(widget.sources)}
        </div>
      );
    }

    // Widget type: trend (mini chart visualization)
    if (widget.widget_type === 'trend') {
      return (
        <div key={idx} className={baseClasses}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {widget.title || 'Trend'}
            </h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900">Trending Up</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{widget.message || 'No details available'}</p>
          {renderSources(widget.sources)}
        </div>
      );
    }

    // Widget type: alert (critical issue card)
    if (widget.widget_type === 'alert') {
      return (
        <div key={idx} className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <h3 className="text-lg font-bold text-gray-900">{widget.title || 'Alert'}</h3>
          </div>
          <p className="text-sm text-gray-700 mb-4">{widget.message || 'No details available'}</p>
          {renderSources(widget.sources)}
        </div>
      );
    }

    // Widget type: snapshot (status summary)
    if (widget.widget_type === 'snapshot') {
      return (
        <div key={idx} className={baseClasses}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {widget.title || 'Snapshot'}
            </h3>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-700 mb-4">{widget.message || 'No details available'}</p>
          {renderSources(widget.sources)}
        </div>
      );
    }

    // Widget type: highlight (good news)
    if (widget.widget_type === 'highlight') {
      return (
        <div key={idx} className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
              {widget.title || 'Highlight'}
            </h3>
            <ArrowUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-700 mb-4">{widget.message || 'No details available'}</p>
          {renderSources(widget.sources)}
        </div>
      );
    }

    // Default fallback
    return (
      <div key={idx} className={baseClasses}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{widget.title || 'Insight'}</h3>
        <p className="text-sm text-gray-600 mb-4">{widget.message || 'No details available'}</p>
        {renderSources(widget.sources)}
      </div>
    );
  };

  const renderSources = (sources: any[]) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sources</p>
        {sources.slice(0, 2).map((source, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 italic mb-1">"{source.quote}"</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">— {source.from}</p>
              {source.document_id && (
                <button
                  onClick={() => handleSourceClick(source.document_id)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  View →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Business Intelligence</h1>
          <p className="text-gray-600">{allWidgets.length} insights • AI-curated from your communications</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Dashboard Grid - Mix of sizes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allWidgets.map((widget, idx) => renderWidget(widget, idx))}
      </div>
    </>
  );
}
