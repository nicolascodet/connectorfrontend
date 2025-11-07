"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestInsights, generateInsights, investigateAlert } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, ArrowUp, ArrowDown, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign
} from "lucide-react";
import DrillDownModal from "./DrillDownModal";
import AlertsWidget from "./AlertsWidget";

interface Widget {
  widget_type: string;
  title: string;
  message: string;
  value?: string | null;
  value_label?: string | null;
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

interface ModernBusinessDashboardProps {
  user: any;
}

export default function ModernBusinessDashboard({ user }: ModernBusinessDashboardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [alertReport, setAlertReport] = useState<any | null>(null);
  const [investigating, setInvestigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 10);

      console.log('=== API Response ===', result);
      console.log('Number of insights:', result.insights?.length);

      if (result.insights && result.insights.length > 0) {
        const parsed = result.insights.map((insight: any) => {
          console.log('Processing insight:', insight.title);
          console.log('Raw structured_data:', insight.structured_data);
          console.log('Type:', typeof insight.structured_data);

          let structured_data = insight.structured_data || [];

          // Handle if it's a string (parse it first)
          if (typeof structured_data === 'string') {
            try {
              structured_data = JSON.parse(structured_data);
              console.log('Parsed from string:', structured_data);
            } catch (e) {
              console.error('Failed to parse structured_data:', e);
              structured_data = [];
            }
          }

          // Now check if it has the wrapper {"type": "array", "items": [...]}
          if (structured_data && typeof structured_data === 'object' && structured_data.type === 'array' && structured_data.items) {
            console.log('Found wrapper, extracting items:', structured_data.items);
            structured_data = structured_data.items;
          }

          console.log('Final structured_data:', structured_data);
          console.log('Is array?', Array.isArray(structured_data));
          console.log('Length:', structured_data?.length);

          return {
            category: insight.category,
            title: insight.title,
            structured_data
          };
        });
        console.log('=== Parsed insights ===', parsed);
        setInsights(parsed);
      } else {
        console.log('No insights in response');
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

  const handleWidgetClick = (widget: Widget) => {
    setSelectedWidget(widget);
    setAlertReport(null);
    setModalOpen(true);
  };

  const handleAlertInvestigate = async (alertId: number, summary: string) => {
    try {
      setInvestigating(true);
      const result = await investigateAlert(alertId);

      setAlertReport(result.report);
      setSelectedWidget({
        widget_type: "alert",
        title: result.report.alert_context?.alert_type?.replace("_", " ") || "Alert Investigation",
        message: summary,
        urgency: result.report.alert_context?.urgency_level || "high",
        value: null,
        value_label: null,
        sources: []
      });
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to investigate alert:", error);
      alert("Failed to generate investigation report");
    } finally {
      setInvestigating(false);
    }
  };

  // Flatten all widgets and filter out empty ones
  const allWidgets: Widget[] = [];
  insights.forEach(insight => {
    if (Array.isArray(insight.structured_data)) {
      insight.structured_data.forEach(widget => {
        // Only include widgets that have actual content
        if (widget && widget.title && widget.message && widget.message.trim() !== '' && widget.message !== 'No details available') {
          console.log('Widget type:', widget.widget_type, 'Title:', widget.title);
          allWidgets.push(widget);
        }
      });
    }
  });

  // Only show the last 6 widgets
  const displayWidgets = allWidgets.slice(-6);

  console.log('Total widgets loaded:', allWidgets.length);
  console.log('Showing last 6 widgets:', displayWidgets.length);
  console.log('Widget types:', displayWidgets.map(w => w.widget_type));

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
    // If all widgets are "alert" type, vary visualization by urgency to add variety
    const effectiveType = widget.widget_type === 'alert' && idx % 3 === 1 ? 'snapshot' :
                          widget.widget_type === 'alert' && idx % 3 === 2 ? 'trend' :
                          widget.widget_type;

    // STAT CARD - Big number with trend arrow
    if (effectiveType === 'stat') {
      // Use structured value field if available, otherwise fallback to regex
      let mainValue = widget.value || 'N/A';
      let valueLabel = widget.value_label || '';

      // Fallback to old regex extraction if value field not present
      if (!widget.value) {
        const numberMatch = (widget.message || '').match(/(\d+\.?\d*%?|\$[\d,]+\.?\d*)/);
        mainValue = numberMatch ? numberMatch[0] : 'N/A';
      }

      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
          <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title}</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-gray-900">{mainValue}</span>
            <ArrowUp className="w-6 h-6 text-blue-600" />
          </div>
          {valueLabel && (
            <p className="text-sm text-gray-500 mb-2">{valueLabel}</p>
          )}
          <p className="text-sm text-gray-600">{widget.message}</p>
        </div>
      );
    }

    // TREND CARD - Shows trending metric
    if (effectiveType === 'trend') {
      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
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

        </div>
      );
    }

    // ALERT CARD - Critical issues with visual indicator and severity bars
    if (effectiveType === 'alert') {
      const severityLevel = widget.urgency === 'critical' ? 100 : widget.urgency === 'high' ? 70 : 40;

      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{widget.title}</h3>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message}</p>

          {/* Severity indicator bars */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500">Severity</span>
              <span className="text-xs font-bold text-red-600">{widget.urgency?.toUpperCase()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                style={{ width: `${severityLevel}%` }}
              />
            </div>
          </div>

        </div>
      );
    }

    // SNAPSHOT CARD - Status update with circular progress and mini metrics
    if (effectiveType === 'snapshot') {
      // Use structured value field if available, otherwise fallback to regex
      let displayValue = widget.value || '7';
      let numberValue = 7;

      if (widget.value) {
        // Parse the value to get a number for the progress ring
        const parsed = parseInt(widget.value.replace(/[^0-9]/g, ''));
        numberValue = isNaN(parsed) ? 7 : parsed;
      } else {
        // Fallback to old regex extraction
        const numberMatch = (widget.message || '').match(/(\d+)/);
        numberValue = numberMatch ? parseInt(numberMatch[0]) : 7;
        displayValue = numberValue.toString();
      }

      const percentage = Math.min((numberValue / 10) * 100, 100);

      return (
        <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
          <h3 className="text-sm font-medium text-gray-500 mb-6">{widget.title}</h3>

          {/* Circular progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-gray-900">{displayValue}</span>
                <ArrowUp className="w-6 h-6 text-blue-600" />
              </div>
              {widget.value_label && (
                <p className="text-sm text-gray-500 mb-2">{widget.value_label}</p>
              )}
              <p className="text-sm text-gray-600">{widget.message.substring(0, 80)}...</p>
            </div>

            {/* Circular progress ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${percentage * 2} 200`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
              </div>
            </div>
          </div>

        </div>
      );
    }

    // HIGHLIGHT CARD - Good news with sparkline and metrics
    if (effectiveType === 'highlight') {
      // Generate positive trend data
      const sparklineData = [40, 45, 50, 48, 60, 70, 85, 90];

      return (
        <div key={idx} className="bg-gradient-to-br from-green-50 via-white to-white rounded-3xl border border-green-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-green-700">{widget.title}</h3>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <p className="text-base text-gray-700 leading-relaxed mb-6">{widget.message}</p>

          {/* Sparkline chart showing positive trend */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Positive trend</span>
            </div>
            <div className="h-12 flex items-end gap-1">
              {sparklineData.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

        </div>
      );
    }

    // DEFAULT CARD - Generic insight with icon
    return (
      <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleWidgetClick(widget)}>
        <h3 className="text-sm font-medium text-gray-500 mb-4">{widget.title || 'Insight'}</h3>
        <p className="text-base text-gray-700 leading-relaxed">{widget.message || 'No details available'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hey {user?.email?.split('@')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 text-lg">Here's what's happening in your business today</p>
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

      {/* Top Row: Hardcoded QuickBooks Stats (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Monthly Revenue</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-gray-900">$127K</span>
            <ArrowUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">+12% vs last month</p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View QuickBooks →
          </button>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Monthly Expenses</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-gray-900">$89K</span>
            <ArrowDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">+8% vs last month</p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View QuickBooks →
          </button>
        </div>

        {/* Profit Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Net Profit</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-gray-900">$38K</span>
            <ArrowUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">30% margin</p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View QuickBooks →
          </button>
        </div>
      </div>

      {/* Intelligence Story: GPT fills these based on communications */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Intelligence Brief</h2>
        <p className="text-gray-600">AI-synthesized insights from your communications</p>
      </div>

      {/* Side-by-Side Layout: Alerts on Left, Intelligence Widgets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts Widget - Left Side (4 columns) */}
        <div className="lg:col-span-4">
          <AlertsWidget onInvestigate={handleAlertInvestigate} />
          {investigating && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-900 font-medium">Generating investigation report...</p>
            </div>
          )}
        </div>

        {/* Intelligence Widgets - Right Side (8 columns) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayWidgets.map((widget, idx) => renderWidget(widget, idx))}
          </div>
        </div>
      </div>

      {/* Drill-Down Modal */}
      {selectedWidget && (
        <DrillDownModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedWidget(null);
            setAlertReport(null);
          }}
          widgetTitle={selectedWidget.title}
          widgetMessage={selectedWidget.message}
          preloadedReport={alertReport}
        />
      )}
    </div>
  );
}
