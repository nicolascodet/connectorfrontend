"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, DollarSign, Package, Wrench,
  AlertCircle, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, FileText,
  TrendingUp, Activity
} from "lucide-react";

interface Insight {
  category: string;
  title: string;
  icon?: string;
  answer: string;
  confidence?: number;
  sources: any[];
  total_sources: number;
  generated_at: string;
  output_format?: string;
  structured_data?: any;
}

interface ManufacturingDashboardProps {
  timePeriod: "daily" | "weekly" | "monthly";
}

export default function ManufacturingDashboard({ timePeriod }: ManufacturingDashboardProps) {
  const [insights, setInsights] = useState<Record<string, Insight>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInsights();
  }, [timePeriod]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights(timePeriod, 20);

      // Index insights by title for easy lookup
      const indexed: Record<string, Insight> = {};
      (result.insights || []).forEach((insight: Insight) => {
        indexed[insight.title] = insight;
      });
      setInsights(indexed);
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

  const toggleCard = (key: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCards(newExpanded);
  };

  // Get specific insight by title
  const getInsight = (title: string) => insights[title];

  // Render widget header
  const WidgetHeader = ({ title, icon, onRefresh, onGenerate, insight }: any) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {insight?.confidence && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {Math.round(insight.confidence * 100)}% confident
          </span>
        )}
      </div>
      {onGenerate && (
        <button
          onClick={onGenerate}
          disabled={generating}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Regenerate"
        >
          <Sparkles className={`w-4 h-4 text-purple-600 ${generating ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );

  // Render list items (quality, machines, customers, materials)
  const renderList = (data: any, emptyMessage: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {item.title || item.issue_type || item.customer || item.machine || item.material || 'Item'}
                  </p>
                  {(item.priority || item.urgency || item.severity) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (item.priority === 'high' || item.urgency === 'critical' || item.severity === 'critical') ? 'bg-red-100 text-red-700' :
                      (item.priority === 'medium' || item.urgency === 'high' || item.severity === 'high') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.priority || item.urgency || item.severity}
                    </span>
                  )}
                  {item.status && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.description || item.problem || item.issue}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render metrics (financials)
  const renderMetrics = (data: any) => {
    const metrics = data?.metrics || [];
    if (metrics.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-8">No financial data available</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {metrics.slice(0, 4).map((metric: any, idx: number) => (
          <div key={idx} className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
            <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {metric.unit === '$' && '$'}{metric.value}{metric.unit !== '$' && metric.unit}
              </span>
              {metric.trend && metric.trend !== 'unknown' && (
                <span className={`text-xs flex items-center gap-0.5 ${
                  metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                  {metric.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                  {metric.trend === 'flat' && <Minus className="w-3 h-3" />}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render production summary text
  const renderText = (text: string) => {
    if (!text || text === "No insights found") {
      return <p className="text-sm text-gray-500 text-center py-8">No production activity data available</p>;
    }
    return (
      <div className="prose prose-sm max-w-none">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
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

  const productionInsight = getInsight("Production Summary");
  const qualityInsight = getInsight("Quality Alerts");
  const machinesInsight = getInsight("Machine Issues");
  const financialInsight = getInsight("Financial Summary");
  const customerInsight = getInsight("Customer Urgencies");
  const materialInsight = getInsight("Material Issues");

  const hasAnyData = Object.keys(insights).length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Insights Generated Yet</h3>
        <p className="text-gray-600 mb-6">
          Click the button below to generate AI-powered manufacturing insights from your emails and documents.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          Generate Insights
        </button>
        <p className="text-xs text-gray-500 mt-4">This will take 45-75 minutes to complete</p>
      </div>
    );
  }

  return (
    <>
      {/* Top Row - Production Summary (Full Width) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <WidgetHeader
          title="Production Summary"
          icon={<Activity className="w-5 h-5 text-gray-600" />}
          insight={productionInsight}
          onGenerate={handleGenerate}
        />
        {productionInsight ? (
          <>
            {renderText(productionInsight.answer)}
            {productionInsight.sources?.length > 0 && (
              <button
                onClick={() => toggleCard('production')}
                className="mt-4 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                {productionInsight.total_sources} sources
                {expandedCards.has('production') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            {expandedCards.has('production') && productionInsight.sources && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {productionInsight.sources.slice(0, 3).map((source: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                    <p className="text-gray-700">{source.text}</p>
                    <p className="text-gray-500 mt-1">Relevance: {Math.round(source.score * 100)}%</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No production summary available</p>
        )}
      </div>

      {/* Second Row - Quality Alerts + Machine Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200">
          <WidgetHeader
            title="Quality Alerts"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            insight={qualityInsight}
          />
          {qualityInsight?.structured_data ? (
            renderList(qualityInsight.structured_data, "No quality issues today")
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No quality data available</p>
          )}
        </div>

        {/* Machine Issues */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200">
          <WidgetHeader
            title="Machine Issues"
            icon={<Wrench className="w-5 h-5 text-orange-600" />}
            insight={machinesInsight}
          />
          {machinesInsight?.structured_data ? (
            renderList(machinesInsight.structured_data, "No machine issues today")
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No machine data available</p>
          )}
        </div>
      </div>

      {/* Third Row - Financial Summary (Full Width) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <WidgetHeader
          title="Financial Summary"
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          insight={financialInsight}
        />
        {financialInsight?.structured_data ? (
          renderMetrics(financialInsight.structured_data)
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No financial data available</p>
        )}
      </div>

      {/* Fourth Row - Customer Urgencies + Material Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Urgencies */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200">
          <WidgetHeader
            title="Customer Urgencies"
            icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
            insight={customerInsight}
          />
          {customerInsight?.structured_data ? (
            renderList(customerInsight.structured_data, "No urgent customer issues")
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No customer data available</p>
          )}
        </div>

        {/* Material Issues */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200">
          <WidgetHeader
            title="Material Issues"
            icon={<Package className="w-5 h-5 text-purple-600" />}
            insight={materialInsight}
          />
          {materialInsight?.structured_data ? (
            renderList(materialInsight.structured_data, "No material issues today")
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No material data available</p>
          )}
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => window.location.href = '/search'}
            className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            Search Documents
          </button>
          <button
            onClick={() => window.location.href = '/connections'}
            className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            Manage Connections
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-3 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Regenerate Insights'}
          </button>
        </div>
      </div>
    </>
  );
}
