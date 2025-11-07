"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Eye, FileText,
  ChevronDown, ChevronUp, Mail, Calendar, User
} from "lucide-react";

interface SourceSnippet {
  text: string;
  from: string;
  date: string;
  context: string;
}

interface Insight {
  type: "trend" | "pattern" | "observation" | "risk" | "update";
  title: string;
  insight: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  urgency: "critical" | "high" | "medium" | "low";
  source_snippets: SourceSnippet[];
  suggested_action?: string;
}

export default function InsightDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 1);

      if (result.insights && result.insights.length > 0) {
        const data = result.insights[0];
        const parsedInsights = data.structured_data || [];
        setInsights(parsedInsights);
        setLastUpdated(new Date(data.generated_at));
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
      alert("Generating insights... This will take 45-75 minutes. Refresh later to see results.");
    } catch (error) {
      console.error("Failed to trigger generation:", error);
      alert("Failed to start generation.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleInsight = (index: number) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
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

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[confidence as keyof typeof colors];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'pattern': return <Eye className="w-5 h-5" />;
      case 'observation': return <Eye className="w-5 h-5" />;
      case 'risk': return <AlertTriangle className="w-5 h-5" />;
      case 'update': return <FileText className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your first AI intelligence briefing. GPT will analyze patterns, trends, and observations from your emails.
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

  // Group by urgency
  const critical = insights.filter(i => i.urgency === 'critical');
  const high = insights.filter(i => i.urgency === 'high');
  const medium = insights.filter(i => i.urgency === 'medium');
  const low = insights.filter(i => i.urgency === 'low');

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-6 border border-purple-100 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Daily Intelligence Briefing</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {lastUpdated ? lastUpdated.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Today'}
            </p>
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
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            {insights.length} insights
          </span>
          <span>•</span>
          <span>Patterns & trends from your emails</span>
          <span>•</span>
          <span>Updated {lastUpdated?.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Critical Insights */}
      {critical.length > 0 && (
        <div className="space-y-4 mb-6">
          {critical.map((insight, idx) => (
            <div key={idx} className={`rounded-2xl p-6 border-2 ${getUrgencyColor(insight.urgency)}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 text-red-600">
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{insight.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyBadge(insight.urgency)}`}>
                      {insight.urgency}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceBadge(insight.confidence)}`}>
                      {insight.confidence} confidence
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{insight.type}</span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{insight.insight}</p>

                  <div className="bg-white/50 rounded-lg p-3 mb-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">AI Reasoning:</p>
                    <p className="text-xs text-gray-600 italic">{insight.reasoning}</p>
                  </div>

                  {insight.suggested_action && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Suggested Action:</p>
                      <p className="text-xs text-blue-700">{insight.suggested_action}</p>
                    </div>
                  )}

                  {/* Sources */}
                  <button
                    onClick={() => toggleInsight(idx)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mt-2"
                  >
                    <FileText className="w-3 h-3" />
                    View {insight.source_snippets.length} source{insight.source_snippets.length !== 1 ? 's' : ''}
                    {expandedInsights.has(idx) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedInsights.has(idx) && (
                    <div className="mt-3 space-y-2">
                      {insight.source_snippets.map((source, sIdx) => (
                        <div key={sIdx} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-xs font-semibold text-gray-900">{source.from}</p>
                                <span className="text-xs text-gray-500">{source.date}</span>
                              </div>
                              <p className="text-xs text-gray-600 italic mb-2">"{source.text}"</p>
                              <p className="text-xs text-gray-500">{source.context}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High Priority */}
      {high.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {high.map((insight, idx) => (
            <div key={idx + critical.length} className={`rounded-2xl p-5 border ${getUrgencyColor(insight.urgency)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 text-orange-600">
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="text-base font-bold text-gray-900">{insight.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getUrgencyBadge(insight.urgency)}`}>
                      {insight.urgency}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-2">{insight.insight}</p>

                  <p className="text-xs text-gray-600 italic mb-2">{insight.reasoning}</p>

                  {insight.suggested_action && (
                    <div className="bg-blue-50 rounded p-2 mb-2 border border-blue-100">
                      <p className="text-xs text-blue-700"><strong>Action:</strong> {insight.suggested_action}</p>
                    </div>
                  )}

                  <button
                    onClick={() => toggleInsight(idx + critical.length)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    {insight.source_snippets.length} sources
                    {expandedInsights.has(idx + critical.length) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedInsights.has(idx + critical.length) && (
                    <div className="mt-2 space-y-1.5">
                      {insight.source_snippets.map((source, sIdx) => (
                        <div key={sIdx} className="bg-white rounded p-2 border border-gray-200 text-xs">
                          <p className="font-semibold text-gray-900 mb-0.5">{source.from}</p>
                          <p className="text-gray-600 italic mb-0.5">"{source.text}"</p>
                          <p className="text-gray-500 text-xs">{source.context}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medium & Low Priority */}
      {(medium.length > 0 || low.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...medium, ...low].map((insight, idx) => (
            <div key={idx + critical.length + high.length} className={`rounded-2xl p-4 border ${getUrgencyColor(insight.urgency)}`}>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5 text-gray-600">
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-xs text-gray-700 mb-2 line-clamp-3">{insight.insight}</p>

                  <button
                    onClick={() => toggleInsight(idx + critical.length + high.length)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    {expandedInsights.has(idx + critical.length + high.length) ? 'Hide details' : 'View details'}
                    {expandedInsights.has(idx + critical.length + high.length) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedInsights.has(idx + critical.length + high.length) && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-700">{insight.insight}</p>
                      <p className="text-xs text-gray-600 italic">{insight.reasoning}</p>
                      {insight.source_snippets.map((source, sIdx) => (
                        <div key={sIdx} className="bg-white rounded p-2 border border-gray-200 text-xs">
                          <p className="font-semibold">{source.from}</p>
                          <p className="text-gray-600 italic">"{source.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 text-center">
        <p className="text-sm text-gray-700 mb-3">
          AI analyzed {insights.reduce((sum, i) => sum + i.source_snippets.length, 0)} source documents to generate these insights
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.href = '/search'}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Search Documents
          </button>
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}
