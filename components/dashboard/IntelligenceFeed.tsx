"use client";

import { useEffect, useState } from "react";
import { getDailyIntelligence, getWeeklyIntelligence } from "@/lib/api";
import { Brain, Loader2, TrendingUp, AlertCircle, Lightbulb, ChevronDown, ChevronRight } from "lucide-react";

interface Intelligence {
  date?: string;
  week_start?: string;
  ai_summary?: string;
  key_insights?: string[];
  most_active_people?: Array<{ name: string; count: number }>;
  most_active_companies?: Array<{ name: string; count: number }>;
  key_topics?: string[];
  wow_change_percent?: number;
  trending_topics?: string[];
}

export default function IntelligenceFeed() {
  const [dailyData, setDailyData] = useState<Intelligence | null>(null);
  const [weeklyData, setWeeklyData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["summary"]));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [daily, weekly] = await Promise.all([
        getDailyIntelligence().catch(() => null),
        getWeeklyIntelligence().catch(() => null),
      ]);
      setDailyData(daily);
      setWeeklyData(weekly);
    } catch (err) {
      console.error("Failed to load intelligence:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
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

  if (error || (!dailyData && !weeklyData)) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Intelligence Feed</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No intelligence data available yet</p>
          <p className="text-xs text-gray-400 mt-2">Intelligence summaries are generated daily</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Intelligence Feed</h3>
      </div>

      <div className="space-y-4">
        {/* AI Summary */}
        {dailyData?.ai_summary && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection("summary")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">Today's Summary</span>
              </div>
              {expandedSections.has("summary") ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has("summary") && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed">{dailyData.ai_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Key Insights */}
        {dailyData?.key_insights && dailyData.key_insights.length > 0 && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection("insights")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-gray-900">Key Insights</span>
              </div>
              {expandedSections.has("insights") ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has("insights") && (
              <div className="px-4 pb-4">
                <ul className="space-y-2">
                  {dailyData.key_insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Weekly Trends */}
        {weeklyData && (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection("weekly")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-900">This Week</span>
                {weeklyData.wow_change_percent !== undefined && (
                  <span className={`text-xs font-medium ${weeklyData.wow_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyData.wow_change_percent >= 0 ? '+' : ''}{Math.round(weeklyData.wow_change_percent)}%
                  </span>
                )}
              </div>
              {expandedSections.has("weekly") ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has("weekly") && (
              <div className="px-4 pb-4 space-y-3">
                {weeklyData.trending_topics && weeklyData.trending_topics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trending Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {weeklyData.trending_topics.slice(0, 5).map((topic, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {weeklyData.most_active_people && weeklyData.most_active_people.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Most Active</p>
                    <div className="space-y-1">
                      {weeklyData.most_active_people.slice(0, 3).map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{person.name}</span>
                          <span className="text-gray-500">{person.count} mentions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          AI-generated insights from your business activity
        </p>
      </div>
    </div>
  );
}
