"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, TrendingUp, TrendingDown,
  Minus, CheckCircle, Activity, Users, ChevronDown, ChevronUp
} from "lucide-react";

interface Widget {
  widget_type: "alert" | "stat" | "trend" | "snapshot" | "highlight";
  title: string;
  content: any;
  sources: Array<{quote: string, from: string}>;
  urgency: "critical" | "high" | "medium" | "low";
}

export default function WidgetDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedWidgets, setExpandedWidgets] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 1);

      console.log("API Response:", result);
      console.log("Insights array:", result.insights);

      if (result.insights && result.insights.length > 0) {
        const data = result.insights[0];
        console.log("First insight:", data);
        console.log("structured_data:", data.structured_data);
        console.log("structured_data type:", typeof data.structured_data);

        let parsedWidgets = data.structured_data || [];

        // If structured_data is a string, parse it
        if (typeof parsedWidgets === 'string') {
          try {
            parsedWidgets = JSON.parse(parsedWidgets);
            console.log("Parsed from JSON string:", parsedWidgets);
          } catch (e) {
            console.error("Failed to parse structured_data string:", e);
            parsedWidgets = [];
          }
        }

        console.log("Final widgets array:", parsedWidgets);
        console.log("Setting widgets state with:", parsedWidgets.length, "widgets");

        setWidgets(parsedWidgets);
      } else {
        console.log("No insights found in response");
      }
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateInsights();
      alert("Generating dashboard... Takes 45-75 minutes. Refresh later.");
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleWidget = (idx: number) => {
    const newExpanded = new Set(expandedWidgets);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedWidgets(newExpanded);
  };

  // ALERT Widget (red banner for urgent issues)
  const renderAlert = (widget: Widget, idx: number) => {
    const alert = widget.content.alert;
    return (
      <div className="md:col-span-2 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{widget.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
            {alert.action && (
              <div className="bg-white/60 rounded-lg p-3 mb-3 border border-red-100">
                <p className="text-xs font-semibold text-red-900">Action:</p>
                <p className="text-xs text-red-700">{alert.action}</p>
              </div>
            )}
            <button
              onClick={() => toggleWidget(idx)}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              {expandedWidgets.has(idx) ? '− Hide sources' : `+ ${widget.sources.length} sources`}
            </button>
            {expandedWidgets.has(idx) && widget.sources && (
              <div className="mt-2 space-y-1">
                {widget.sources.map((s, i) => (
                  <div key={i} className="bg-white/60 rounded p-2 text-xs border border-red-100">
                    <p className="text-gray-700 italic">"{s.quote}"</p>
                    <p className="text-gray-500 mt-0.5">— {s.from}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // STAT Widget (big number)
  const renderStat = (widget: Widget, idx: number) => {
    const stat = widget.content.stat;
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{widget.title}</h4>
          {stat.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
          {stat.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
          {stat.trend === 'neutral' && <Minus className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
        <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
        <p className="text-xs text-gray-500">{stat.context}</p>
        <button
          onClick={() => toggleWidget(idx)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-3"
        >
          {expandedWidgets.has(idx) ? '−' : '+'} source
        </button>
        {expandedWidgets.has(idx) && widget.sources && (
          <div className="mt-2 bg-white rounded p-2 text-xs border border-blue-100">
            <p className="text-gray-700 italic">"{widget.sources[0]?.quote}"</p>
            <p className="text-gray-500 mt-0.5">— {widget.sources[0]?.from}</p>
          </div>
        )}
      </div>
    );
  };

  // TREND Widget (mini chart)
  const renderTrend = (widget: Widget, idx: number) => {
    const trend = widget.content.trend;
    const data = trend.data || [];
    const maxVal = Math.max(...data);

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">{widget.title}</h4>
          {trend.direction === 'up' && <TrendingUp className="w-5 h-5 text-red-600" />}
          {trend.direction === 'down' && <TrendingDown className="w-5 h-5 text-green-600" />}
          {trend.direction === 'flat' && <Minus className="w-5 h-5 text-gray-400" />}
        </div>

        {/* Mini sparkline */}
        <div className="flex items-end gap-1 h-16 mb-3">
          {data.map((val: number, i: number) => (
            <div
              key={i}
              className="flex-1 bg-purple-500 rounded-t transition-all"
              style={{ height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%` }}
            />
          ))}
        </div>

        <p className="text-xs text-gray-700 mb-2">{trend.summary}</p>
        <button
          onClick={() => toggleWidget(idx)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          {expandedWidgets.has(idx) ? '−' : '+'} source
        </button>
        {expandedWidgets.has(idx) && widget.sources && (
          <div className="mt-2 bg-gray-50 rounded p-2 text-xs border border-gray-200">
            <p className="text-gray-700 italic">"{widget.sources[0]?.quote}"</p>
            <p className="text-gray-500 mt-0.5">— {widget.sources[0]?.from}</p>
          </div>
        )}
      </div>
    );
  };

  // SNAPSHOT Widget (status summary)
  const renderSnapshot = (widget: Widget, idx: number) => {
    const snap = widget.content.snapshot;
    const statusColors = {
      good: 'from-green-50 to-white border-green-200',
      neutral: 'from-gray-50 to-white border-gray-200',
      concerning: 'from-yellow-50 to-white border-yellow-200',
      critical: 'from-red-50 to-white border-red-200'
    };
    const statusIcons = {
      good: <CheckCircle className="w-5 h-5 text-green-600" />,
      neutral: <Activity className="w-5 h-5 text-gray-600" />,
      concerning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      critical: <AlertTriangle className="w-5 h-5 text-red-600" />
    };

    return (
      <div className={`bg-gradient-to-br ${statusColors[snap.status as keyof typeof statusColors]} border rounded-2xl p-5`}>
        <div className="flex items-center gap-2 mb-3">
          {statusIcons[snap.status as keyof typeof statusIcons]}
          <h4 className="text-sm font-semibold text-gray-900">{widget.title}</h4>
        </div>
        <p className="text-sm text-gray-700 mb-3">{snap.summary}</p>
        {snap.details && snap.details.length > 0 && (
          <ul className="space-y-1 mb-2">
            {snap.details.map((detail: string, i: number) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => toggleWidget(idx)}
          className="text-xs text-gray-600 hover:text-gray-700 font-medium"
        >
          {expandedWidgets.has(idx) ? '−' : '+'} sources
        </button>
        {expandedWidgets.has(idx) && widget.sources && (
          <div className="mt-2 space-y-1">
            {widget.sources.map((s, i) => (
              <div key={i} className="bg-white/60 rounded p-2 text-xs border border-gray-200">
                <p className="text-gray-700 italic">"{s.quote}"</p>
                <p className="text-gray-500 mt-0.5">— {s.from}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // HIGHLIGHT Widget (good news)
  const renderHighlight = (widget: Widget, idx: number) => {
    const hl = widget.content.highlight;
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">{widget.title}</h4>
            <p className="text-sm text-gray-700 mb-2">{hl.message}</p>
            <p className="text-xs text-green-700">{hl.impact}</p>
            <button
              onClick={() => toggleWidget(idx)}
              className="text-xs text-green-600 hover:text-green-700 font-medium mt-2"
            >
              {expandedWidgets.has(idx) ? '−' : '+'} source
            </button>
            {expandedWidgets.has(idx) && widget.sources && (
              <div className="mt-2 bg-white/60 rounded p-2 text-xs border border-green-100">
                <p className="text-gray-700 italic">"{widget.sources[0]?.quote}"</p>
                <p className="text-gray-500 mt-0.5">— {widget.sources[0]?.from}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Dashboard Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your AI-powered dashboard. GPT will fill widgets with the most relevant insights.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          Generate Dashboard
        </button>
        <p className="text-xs text-gray-500 mt-4">Takes 45-75 minutes</p>
      </div>
    );
  }

  // Group by urgency
  const critical = widgets.filter(w => w.urgency === 'critical');
  const high = widgets.filter(w => w.urgency === 'high');
  const medium = widgets.filter(w => w.urgency === 'medium');
  const low = widgets.filter(w => w.urgency === 'low');

  return (
    <>
      {/* Debug Panel */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
        <p className="text-sm font-mono text-yellow-900">
          DEBUG: Found {widgets.length} widgets in state
        </p>
        <button
          onClick={() => console.log("Current widgets state:", widgets)}
          className="text-xs text-yellow-700 underline mt-1"
        >
          Log widgets to console
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Manufacturing Intelligence</h1>
          <p className="text-sm text-gray-600">{widgets.length} insights • Curated by AI</p>
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

      {/* Critical Widgets (Full Width) */}
      {critical.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {critical.map((w, idx) => {
            if (w.widget_type === 'alert') return renderAlert(w, idx);
            return null;
          })}
        </div>
      )}

      {/* High Priority (2 Column Grid) */}
      {high.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {high.map((w, idx) => {
            const key = idx + critical.length;
            if (w.widget_type === 'stat') return <div key={key}>{renderStat(w, key)}</div>;
            if (w.widget_type === 'trend') return <div key={key}>{renderTrend(w, key)}</div>;
            if (w.widget_type === 'snapshot') return <div key={key}>{renderSnapshot(w, key)}</div>;
            if (w.widget_type === 'highlight') return <div key={key}>{renderHighlight(w, key)}</div>;
            return null;
          })}
        </div>
      )}

      {/* Medium & Low Priority (3 Column Grid) */}
      {(medium.length > 0 || low.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...medium, ...low].map((w, idx) => {
            const key = idx + critical.length + high.length;
            if (w.widget_type === 'stat') return <div key={key}>{renderStat(w, key)}</div>;
            if (w.widget_type === 'trend') return <div key={key}>{renderTrend(w, key)}</div>;
            if (w.widget_type === 'snapshot') return <div key={key}>{renderSnapshot(w, key)}</div>;
            if (w.widget_type === 'highlight') return <div key={key}>{renderHighlight(w, key)}</div>;
            return null;
          })}
        </div>
      )}
    </>
  );
}
