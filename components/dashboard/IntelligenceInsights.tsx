"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import { Brain, RefreshCw, Sparkles, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface Insight {
  category: string;
  title: string;
  icon?: string;
  answer: string;
  confidence?: number;
  sources: any[];
  total_sources: number;
  generated_at: string;
}

export default function IntelligenceInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 3);
      setInsights(result.insights || []);
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
      alert("Insight generation started! This will take 45-75 minutes. Refresh the page later to see results.");
    } catch (error) {
      console.error("Failed to trigger generation:", error);
      alert("Failed to start generation. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Intelligence</h3>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Intelligence</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            RAG-Powered
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadInsights}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Generate new insights (45-75 min)"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Generate
          </button>
        </div>
      </div>

      {/* Insights */}
      {insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm">No insights generated yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Generate" to create AI-powered insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
            >
              {/* Insight Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(insight.generated_at).toLocaleString()}
                  </p>
                </div>
                {insight.confidence && (
                  <div className="flex flex-col items-end ml-3">
                    <span className="text-xs text-gray-500">Confidence</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Answer Preview */}
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {insight.answer}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{insight.total_sources} sources</span>
                </div>
                <button
                  onClick={() => toggleExpand(index)}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                >
                  {expandedIndex === index ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show more</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedIndex === index && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-3">{insight.answer}</p>
                  {insight.sources && insight.sources.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Source Documents:</p>
                      <div className="space-y-1.5">
                        {insight.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                            <p className="text-gray-700 line-clamp-2">{source.text}</p>
                            <p className="text-gray-500 mt-1">
                              Score: {Math.round(source.score * 100)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
