"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, AlertTriangle, DollarSign, Package, Wrench,
  AlertCircle, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, FileText
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
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInsights();
  }, [timePeriod]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights(timePeriod, 20);
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
      alert(`Generating ${timePeriod} insights... This will take 45-75 minutes. Refresh the page later to see results.`);
    } catch (error) {
      console.error("Failed to trigger generation:", error);
      alert("Failed to start generation. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // Render content based on output format
  const renderContent = (insight: Insight) => {
    const format = insight.output_format || 'text';
    const data = insight.structured_data;

    if (!data && format !== 'text') {
      return <p className="text-sm text-gray-700 whitespace-pre-wrap">{insight.answer}</p>;
    }

    switch (format) {
      case 'list':
        return renderList(data);
      case 'table':
        return renderTable(data);
      case 'metric':
        return renderMetrics(data);
      case 'chart':
        return renderChart(data);
      default:
        return <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{insight.answer}</p>;
    }
  };

  const renderList = (data: any) => {
    if (!data || !Array.isArray(data)) return <p className="text-sm text-gray-500">No data available</p>;

    return (
      <div className="space-y-3">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-semibold text-gray-900">{item.title || item.issue_type || item.focus_area || 'Item'}</h5>
                  {item.priority && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.priority === 'high' || item.priority === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                  {item.urgency && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                      item.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.urgency}
                    </span>
                  )}
                  {item.severity && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.severity}
                    </span>
                  )}
                  {item.status && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {item.status}
                    </span>
                  )}
                  {item.category && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">{item.description || item.problem || item.issue || item.rationale}</p>
                {(item.affected || item.customer || item.machine || item.impact || item.supplier || item.material) && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Affected:</span> {item.affected || item.customer || item.machine || item.impact || item.supplier || item.material}
                  </p>
                )}
                {(item.source || item.action_required || item.recommendation || item.expected_impact || item.suggested_actions) && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">
                      {item.source ? 'Source:' : item.action_required ? 'Action:' : item.recommendation ? 'Recommendation:' : item.expected_impact ? 'Impact:' : 'Actions:'}
                    </span> {item.source || item.action_required || item.recommendation || item.expected_impact || item.suggested_actions}
                  </p>
                )}
                {item.frequency && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Frequency:</span> {item.frequency} times
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = (data: any) => {
    if (!data || !data.columns || !data.rows) return <p className="text-sm text-gray-500">No data available</p>;

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
            <tr>
              {data.columns.map((col: string, idx: number) => (
                <th key={idx} className="text-left px-4 py-3 font-semibold text-gray-700 text-sm">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.rows.map((row: any[], rowIdx: number) => (
              <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                {row.map((cell: any, cellIdx: number) => {
                  const colType = data.column_types?.[cellIdx] || 'text';
                  return (
                    <td key={cellIdx} className="px-4 py-3 text-sm">
                      {renderTableCell(cell, colType)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableCell = (value: any, type: string) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;

    switch (type) {
      case 'currency':
        return <span className="font-semibold text-green-700">${parseFloat(value).toLocaleString()}</span>;
      case 'percentage':
        return <span className="font-semibold">{value}%</span>;
      case 'badge':
        const badgeColors: any = {
          'excellent': 'bg-green-100 text-green-700',
          'good': 'bg-blue-100 text-blue-700',
          'concerning': 'bg-yellow-100 text-yellow-700',
          'critical': 'bg-red-100 text-red-700',
          'received': 'bg-blue-100 text-blue-700',
          'in-production': 'bg-purple-100 text-purple-700',
          'shipped': 'bg-green-100 text-green-700',
          'on-hold': 'bg-red-100 text-red-700',
          'improving': 'bg-green-100 text-green-700',
          'stable': 'bg-blue-100 text-blue-700',
          'declining': 'bg-red-100 text-red-700',
        };
        const color = badgeColors[value.toString().toLowerCase()] || 'bg-gray-100 text-gray-700';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{value}</span>;
      case 'number':
        return <span className="font-semibold">{parseFloat(value).toLocaleString()}</span>;
      default:
        return <span className="text-gray-700">{value}</span>;
    }
  };

  const renderMetrics = (data: any) => {
    const metrics = data.metrics || (data.primary_metric ? [data.primary_metric, ...(data.secondary_metrics || [])] : []);

    if (!metrics || metrics.length === 0) return <p className="text-sm text-gray-500">No metrics available</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric: any, idx: number) => (
          <div key={idx} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">{metric.label}</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">
                {metric.unit === '$' && '$'}{metric.value}{metric.unit !== '$' && metric.unit}
              </span>
              {metric.trend && metric.trend !== 'unknown' && (
                <span className={`text-sm flex items-center gap-0.5 font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' && <ArrowUp className="w-4 h-4" />}
                  {metric.trend === 'down' && <ArrowDown className="w-4 h-4" />}
                  {metric.trend === 'flat' && <Minus className="w-4 h-4" />}
                  {metric.change}
                </span>
              )}
            </div>
            {metric.target && (
              <p className="text-xs text-gray-500 mt-1">Target: {metric.target}{metric.unit}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderChart = (data: any) => {
    if (!data || !data.datasets) return <p className="text-sm text-gray-500">Chart data unavailable</p>;

    return (
      <div className="space-y-6">
        {data.datasets.map((dataset: any, idx: number) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-4">{dataset.label}</p>
            <div className="flex items-end gap-2 h-48">
              {dataset.data.map((point: any, pointIdx: number) => {
                const value = typeof point === 'object' ? point.value : point;
                const maxValue = Math.max(...dataset.data.map((p: any) => typeof p === 'object' ? p.value : p));
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                  <div key={pointIdx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${height}%`,
                        backgroundColor: dataset.color || '#8b5cf6'
                      }}
                      title={`${value}`}
                    />
                    {typeof point === 'object' && point.date && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading manufacturing insights...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
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
          Generate {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Insights
        </button>
        <p className="text-xs text-gray-500 mt-4">This will take 45-75 minutes to complete</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {insights.length} {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Insights
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date(insights[0]?.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadInsights}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Section Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(insight.category)}
                    <h3 className="text-lg font-bold text-gray-900">{insight.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    Generated {new Date(insight.generated_at).toLocaleString()}
                  </p>
                </div>
                {insight.confidence && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 font-medium">Confidence</span>
                    <span className="text-lg font-bold text-purple-600">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section Content */}
            <div className="px-6 py-5">
              {renderContent(insight)}
            </div>

            {/* Section Footer */}
            {insight.sources && insight.sources.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button
                  onClick={() => toggleSection(index)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{insight.total_sources} source documents</span>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Expanded Sources */}
                {expandedSections.has(index) && (
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {insight.sources.slice(0, 5).map((source, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                        <p className="text-gray-700 leading-relaxed">{source.text}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          Relevance: {Math.round(source.score * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Category icon helper
function getCategoryIcon(category: string) {
  const iconClass = "w-5 h-5";
  switch (category) {
    case 'quality':
      return <AlertTriangle className={`${iconClass} text-red-600`} />;
    case 'financials':
      return <DollarSign className={`${iconClass} text-green-600`} />;
    case 'machines':
      return <Wrench className={`${iconClass} text-orange-600`} />;
    case 'customers':
      return <AlertCircle className={`${iconClass} text-blue-600`} />;
    case 'materials':
      return <Package className={`${iconClass} text-purple-600`} />;
    case 'production':
      return <Package className={`${iconClass} text-gray-600`} />;
    default:
      return <Brain className={`${iconClass} text-purple-600`} />;
  }
}
