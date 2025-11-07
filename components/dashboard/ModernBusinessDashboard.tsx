"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, ArrowUp, ArrowDown, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign
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

export default function ModernBusinessDashboard() {
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

  // Flatten all widgets and filter out empty ones
  const allWidgets: Widget[] = [];
  insights.forEach(insight => {
    if (Array.isArray(insight.structured_data)) {
      insight.structured_data.forEach(widget => {
        // Only include widgets that have actual content
        if (widget && widget.title && widget.message && widget.message.trim() !== '' && widget.message !== 'No details available') {
          allWidgets.push(widget);
        }
      });
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (allWidgets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
        <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Insights Yet</h3>
        <p className="text-gray-500 mb-8 text-lg">
          Generate AI-powered insights from your communications
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center gap-3 mx-auto transition-colors disabled:opacity-50 shadow-sm"
        >
          <Sparkles className={`w-6 h-6 ${generating ? 'animate-spin' : ''}`} />
          Generate Insights
        </button>
        <p className="text-sm text-gray-400 mt-4">Takes 45-75 minutes</p>
      </div>
    );
  }

  // Render different widget types with modern styling
  const renderWidget = (widget: Widget, idx: number) => {
    // STAT CARD - Big number with trend arrow (like "15% Revenues")
    if (widget.widget_type === 'stat') {
      // Try to extract number from message
      const numberMatch = (widget.message || '').match(/(\d+\.?\d*%?|\$[\d,]+\.?\d*)/);
      const mainValue = numberMatch ? numberMatch[0] : '';
      const description = widget.message?.replace(mainValue, '').trim() || widget.title;

      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title}</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-gray-900">{mainValue || 'N/A'}</span>
            <ArrowUp className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">{description}</p>

          {widget.sources?.[0] && (
            <button
              onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View report →
            </button>
          )}
        </div>
      );
    }

    // TREND CARD - Shows trending metric
    if (widget.widget_type === 'trend') {
      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{widget.title}</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <p className="text-base text-gray-700 mb-6 leading-relaxed">{widget.message || 'Trending up'}</p>

          {/* Mini trend visualization */}
          <div className="h-12 flex items-end gap-1">
            {[30, 45, 40, 55, 60, 70, 65, 80, 85, 90].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {widget.sources?.[0] && (
            <button
              onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View details →
            </button>
          )}
        </div>
      );
    }

    // ALERT CARD - Critical issues with visual indicator
    if (widget.widget_type === 'alert') {
      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{widget.title}</h3>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>

          <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message}</p>

          {widget.sources?.[0] && (
            <button
              onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {widget.sources[0].from} →
            </button>
          )}
        </div>
      );
    }

    // SNAPSHOT CARD - Status update with progress indicator
    if (widget.widget_type === 'snapshot') {
      // Try to extract a number for visual representation
      const numberMatch = (widget.message || '').match(/(\d+)/);
      const hasNumber = numberMatch !== null;
      const numberValue = hasNumber ? parseInt(numberMatch[0]) : 0;
      const percentage = hasNumber ? Math.min(numberValue * 10, 100) : 50; // Scale for visual

      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title}</h3>

          {hasNumber && (
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-bold text-gray-900">{numberValue}</span>
              <ArrowUp className="w-6 h-6 text-blue-600" />
            </div>
          )}

          <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message}</p>

          {widget.sources?.[0] && (
            <button
              onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View report →
            </button>
          )}
        </div>
      );
    }

    // HIGHLIGHT CARD - Good news with checkmark
    if (widget.widget_type === 'highlight') {
      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{widget.title}</h3>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>

          <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message}</p>

          {widget.sources?.[0] && (
            <button
              onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View details →
            </button>
          )}
        </div>
      );
    }

    // DEFAULT CARD - Generic insight with icon
    return (
      <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title || 'Insight'}</h3>
        <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message || 'No details available'}</p>

        {widget.sources?.[0] && (
          <button
            onClick={() => widget.sources[0].document_id && handleSourceClick(widget.sources[0].document_id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View source →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Intelligence</h1>
          <p className="text-gray-500 text-lg">{allWidgets.length} insights • AI-curated from your communications</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Dashboard Grid - Responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {allWidgets.map((widget, idx) => renderWidget(widget, idx))}
      </div>
    </div>
  );
}
