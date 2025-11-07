"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, TrendingUp, AlertCircle
} from "lucide-react";

interface Widget {
  widget_type: string;
  title: string;
  message: string;
  urgency: "critical" | "high" | "medium" | "low";
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

export default function BusinessWidgets() {
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

      console.log("API Response:", result);

      if (result.insights && result.insights.length > 0) {
        const parsed = result.insights.map((insight: any) => {
          let structured_data = insight.structured_data || [];

          // Parse if string
          if (typeof structured_data === 'string') {
            try {
              structured_data = JSON.parse(structured_data);
            } catch (e) {
              console.error("Failed to parse structured_data:", e);
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyTextColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-900';
      case 'high': return 'text-orange-900';
      case 'medium': return 'text-yellow-900';
      case 'low': return 'text-blue-900';
      default: return 'text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Flatten all widgets from all insights
  const allWidgets: Array<Widget & { insightTitle: string }> = [];
  insights.forEach(insight => {
    if (Array.isArray(insight.structured_data)) {
      insight.structured_data.forEach(widget => {
        allWidgets.push({
          ...widget,
          insightTitle: insight.title
        });
      });
    }
  });

  if (allWidgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Business Intelligence</h1>
          <p className="text-sm text-gray-600">{allWidgets.length} insights • AI-curated</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allWidgets.map((widget, idx) => (
          <div
            key={idx}
            className={`${getUrgencyColor(widget.urgency)} border rounded-2xl p-5 transition-all hover:shadow-lg`}
          >
            {/* Title */}
            <h3 className={`text-lg font-bold ${getUrgencyTextColor(widget.urgency)} mb-2`}>
              {widget.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-700 mb-4">
              {widget.message}
            </p>

            {/* Sources */}
            {widget.sources && widget.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Sources:</p>
                {widget.sources.map((source, sidx) => (
                  <div key={sidx} className="bg-white/70 rounded-lg p-2 border border-gray-200">
                    <p className="text-xs text-gray-700 italic mb-1">"{source.quote}"</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">— {source.from}</p>
                      {source.document_id && (
                        <button
                          onClick={() => handleSourceClick(source.document_id)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium underline"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Urgency Badge */}
            <div className="mt-4 flex items-center gap-2">
              {widget.urgency === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {widget.urgency === 'high' && <AlertCircle className="w-4 h-4 text-orange-600" />}
              <span className="text-xs font-medium text-gray-600 uppercase">
                {widget.urgency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
