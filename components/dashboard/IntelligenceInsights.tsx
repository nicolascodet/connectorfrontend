"use client";

import { useEffect, useState } from "react";
import { getLatestInsights, generateInsights } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, ChevronDown, ChevronUp, FileText,
  AlertTriangle, DollarSign, TrendingUp, TrendingDown, Package, Wrench,
  AlertCircle, ArrowUp, ArrowDown, Minus
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
      const result = await getLatestInsights("daily", 10);
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

  // Render based on output_format
  const renderInsightContent = (insight: Insight) => {
    const format = insight.output_format || 'text';
    const data = insight.structured_data;

    if (!data && format !== 'text') {
      // Fallback to text if structured_data failed to parse
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
        return <p className="text-sm text-gray-700 whitespace-pre-wrap">{insight.answer}</p>;
    }
  };

  // LIST renderer (e.g., quality issues, machine failures)
  const renderList = (data: any) => {
    if (!data || !Array.isArray(data)) return <p className="text-sm text-gray-500">No data available</p>;

    return (
      <div className="space-y-2">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-gray-900 text-sm">{item.title || item.issue_type || 'Issue'}</h5>
                  {item.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.priority === 'high' || item.priority === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                  {item.status && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 mb-1">{item.description || item.problem || item.issue}</p>
                {(item.affected || item.customer || item.machine || item.impact) && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Affected:</span> {item.affected || item.customer || item.machine || item.impact}
                  </p>
                )}
                {item.source && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Source:</span> {item.source}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // TABLE renderer (e.g., customer orders, supplier performance)
  const renderTable = (data: any) => {
    if (!data || !data.columns || !data.rows) return <p className="text-sm text-gray-500">No data available</p>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              {data.columns.map((col: string, idx: number) => (
                <th key={idx} className="text-left px-3 py-2 font-medium text-gray-700 text-xs">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.rows.map((row: any[], rowIdx: number) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {row.map((cell: any, cellIdx: number) => {
                  const colType = data.column_types?.[cellIdx] || 'text';
                  return (
                    <td key={cellIdx} className="px-3 py-2">
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
        return <span className="font-medium text-green-700">${parseFloat(value).toLocaleString()}</span>;
      case 'percentage':
        return <span className="font-medium">{value}%</span>;
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
        };
        const color = badgeColors[value.toString().toLowerCase()] || 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{value}</span>;
      case 'number':
        return <span className="font-medium">{parseFloat(value).toLocaleString()}</span>;
      default:
        return <span className="text-gray-700">{value}</span>;
    }
  };

  // METRIC renderer (e.g., financial summary, production metrics)
  const renderMetrics = (data: any) => {
    const metrics = data.metrics || (data.primary_metric ? [data.primary_metric, ...(data.secondary_metrics || [])] : []);

    if (!metrics || metrics.length === 0) return <p className="text-sm text-gray-500">No metrics available</p>;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((metric: any, idx: number) => (
          <div key={idx} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3">
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

  // CHART renderer (simplified - just show data points)
  const renderChart = (data: any) => {
    if (!data || !data.datasets) return <p className="text-sm text-gray-500">Chart data unavailable</p>;

    return (
      <div className="space-y-3">
        {data.datasets.map((dataset: any, idx: number) => (
          <div key={idx}>
            <p className="text-xs font-medium text-gray-700 mb-2">{dataset.label}</p>
            <div className="flex items-end gap-1 h-24">
              {dataset.data.map((point: any, pointIdx: number) => {
                const value = typeof point === 'object' ? point.value : point;
                const maxValue = Math.max(...dataset.data.map((p: any) => typeof p === 'object' ? p.value : p));
                const height = (value / maxValue) * 100;

                return (
                  <div key={pointIdx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                      style={{ height: `${height}%` }}
                      title={`${value}`}
                    />
                    {typeof point === 'object' && point.date && (
                      <span className="text-xs text-gray-500 rotate-45 origin-top-left">
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
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Manufacturing Intelligence</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Manufacturing Intelligence</h3>
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
          <p className="text-xs text-gray-400 mt-1">Click "Generate" to analyze your manufacturing operations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
            >
              {/* Insight Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(insight.category)}
                    <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500">
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

              {/* Insight Content */}
              <div className="mb-3">
                {renderInsightContent(insight)}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{insight.total_sources} sources</span>
                </div>
                {insight.sources && insight.sources.length > 0 && (
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {expandedIndex === index ? (
                      <>
                        <span>Hide sources</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>View sources</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Sources */}
              {expandedIndex === index && insight.sources && insight.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Source Documents:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {insight.sources.slice(0, 5).map((source, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                        <p className="text-gray-700">{source.text}</p>
                        <p className="text-gray-500 mt-1">
                          Relevance: {Math.round(source.score * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Category icon helper
function getCategoryIcon(category: string) {
  const iconClass = "w-4 h-4";
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
