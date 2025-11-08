"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, TrendingUp, TrendingDown, Users, DollarSign, Calendar, AlertCircle, CheckCircle, Clock, ExternalLink, FileText, Mail, Loader2, Download, Save } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDrillDownReport, getSourceDocument, saveReport } from '@/lib/api';
import SmartMarkdown from '@/components/SmartMarkdown';
import { Button } from '@/components/ui/button';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetTitle: string;
  widgetMessage: string;
  preloadedReport?: any;  // For alert investigations
}

interface ReportData {
  title: string;
  executive_summary?: string;
  root_cause?: {
    primary_cause: string;
    contributing_factors: string[];
    evidence: string[];
  };
  impact?: {
    financial_impact: string;
    customers_affected: string[];
    orders_blocked: string[];
    urgency: string;
    risk_level: string;
  };
  timeline?: Array<{
    date: string;
    event: string;
    source: string;
  }>;
  key_stakeholders?: Array<{
    name: string;
    role: string;
    status: string;
  }>;
  recommendations?: Array<{
    action: string;
    owner: string;
    deadline: string;
    expected_outcome: string;
    priority: number;
  }>;
  metrics?: Array<{
    metric_name: string;
    current_value: string;
    trend: string;
    context: string;
  }>;
  sources?: Array<{
    document_id: string;
    text: string;
    from: string;
    date?: string;
    type?: string;
    sender?: string;
  }>;
  total_sources?: number;
  generation_time_ms?: number;
  error?: string;
  raw_analysis?: string;
  alert_context?: {
    alert_id: number;
    urgency_level: string;
    alert_type: string;
    key_entities: string[];
    detected_at: string;
    source_document: any;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DrillDownModal({ isOpen, onClose, widgetTitle, widgetMessage, preloadedReport }: DrillDownModalProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Use preloaded report if available (from alert investigation)
      if (preloadedReport) {
        setReport(preloadedReport);
        setLoading(false);
      } else {
        loadReport();
      }
    }
  }, [isOpen, widgetTitle, widgetMessage, preloadedReport]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDrillDownReport(widgetTitle, widgetMessage);
      setReport(response.report);
    } catch (err: any) {
      console.error('Failed to load drill-down report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = async (documentId: string) => {
    if (!documentId) return;

    setLoadingDocument(true);
    try {
      const doc = await getSourceDocument(documentId);
      setSelectedDocument(doc);
    } catch (err: any) {
      console.error('Failed to load document:', err);
      alert('Failed to load document: ' + err.message);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setExporting(true);
    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [0.5, 0.5],
        filename: `${widgetTitle.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;

    setSaving(true);
    try {
      const result = await saveReport({
        title: widgetTitle,
        report_type: preloadedReport ? 'alert_investigation' : 'widget_drilldown',
        report_data: report,
        source_widget_title: widgetTitle,
        source_widget_message: widgetMessage,
        source_alert_id: report.alert_context?.alert_id || undefined
      });

      setSaved(true);
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      console.error('Failed to save report:', err);
      alert('Failed to save report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const getRiskColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency?.toLowerCase()) {
      case 'immediate': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'this-week': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'this-month': return <Calendar className="w-5 h-5 text-yellow-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend?.toLowerCase() === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend?.toLowerCase() === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex-1">
              <h2 className="text-3xl font-normal text-gray-900 mb-2">{widgetTitle}</h2>
              <p className="text-gray-600 font-light">{widgetMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8" ref={reportRef}>
            <div className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 font-normal">Generating detailed report...</p>
                  <p className="text-sm text-gray-400 font-light mt-2">Analyzing documents and connecting the dots</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Failed to Generate Report</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && report && (
              <>
                {/* Executive Summary */}
                {report.executive_summary && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                    <h3 className="text-xl font-normal text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Executive Summary
                    </h3>
                    <div className="text-gray-700 leading-relaxed text-base font-light">
                      <SmartMarkdown content={report.executive_summary} />
                    </div>
                  </div>
                )}

                {/* Impact Assessment */}
                {report.impact && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Impact Assessment
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      {/* Financial Impact */}
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-sm text-green-600 font-medium mb-1">Financial Impact</div>
                        <div className="text-2xl font-bold text-green-900">{report.impact.financial_impact}</div>
                      </div>

                      {/* Risk Level */}
                      <div className={`rounded-xl p-4 border ${getRiskColor(report.impact.risk_level)}`}>
                        <div className="text-sm font-medium mb-1">Risk Level</div>
                        <div className="text-2xl font-bold capitalize">{report.impact.risk_level}</div>
                      </div>

                      {/* Urgency */}
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-orange-600 font-medium">Urgency</div>
                          {getUrgencyIcon(report.impact.urgency)}
                        </div>
                        <div className="text-lg font-semibold text-orange-900 capitalize">{report.impact.urgency?.replace('-', ' ')}</div>
                      </div>

                      {/* Customers Affected */}
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <div className="text-sm text-purple-600 font-medium">Customers Affected</div>
                        </div>
                        <div className="text-lg font-semibold text-purple-900">
                          {report.impact.customers_affected?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Customers List */}
                    {report.impact.customers_affected && report.impact.customers_affected.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-600 mb-2">Affected Customers:</div>
                        <div className="flex flex-wrap gap-2">
                          {report.impact.customers_affected.map((customer, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {customer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders Blocked */}
                    {report.impact.orders_blocked && report.impact.orders_blocked.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Blocked Orders:</div>
                        <div className="flex flex-wrap gap-2">
                          {report.impact.orders_blocked.map((order, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              {order}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Root Cause Analysis */}
                {report.root_cause && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Root Cause Analysis</h3>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <div className="text-sm text-red-600 font-medium mb-2">Primary Cause</div>
                      <p className="text-red-900 font-medium">{report.root_cause.primary_cause}</p>
                    </div>

                    {report.root_cause.contributing_factors && report.root_cause.contributing_factors.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-600 mb-3">Contributing Factors</div>
                        <div className="space-y-2">
                          {report.root_cause.contributing_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                {idx + 1}
                              </div>
                              <p className="text-gray-700 flex-1">{factor}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.root_cause.evidence && report.root_cause.evidence.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-3">Evidence</div>
                        <div className="space-y-2">
                          {report.root_cause.evidence.map((evidence, idx) => (
                            <div key={idx} className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg p-3">
                              <p className="text-gray-700 italic text-sm">"{evidence}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {report.timeline && report.timeline.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Timeline
                    </h3>

                    <div className="space-y-4">
                      {report.timeline.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            {idx < report.timeline!.length - 1 && (
                              <div className="w-0.5 h-full bg-blue-200 flex-1 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="text-sm text-blue-600 font-medium mb-1">{item.date}</div>
                            <div className="text-gray-900 font-medium mb-1">{item.event}</div>
                            <div className="text-sm text-gray-500">{item.source}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {report.metrics && report.metrics.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Key Metrics</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {report.metrics.map((metric, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-600">{metric.metric_name}</div>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-2">{metric.current_value}</div>
                          <p className="text-sm text-gray-600">{metric.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stakeholders */}
                {report.key_stakeholders && report.key_stakeholders.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Key Stakeholders
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {report.key_stakeholders.map((stakeholder, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                          <div className="font-semibold text-purple-900 mb-1">{stakeholder.name}</div>
                          <div className="text-sm text-purple-700 mb-2">{stakeholder.role}</div>
                          <div className="text-sm text-gray-600 italic">{stakeholder.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations && report.recommendations.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Recommended Actions
                    </h3>

                    <div className="space-y-5">
                      {report.recommendations
                        .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                        .map((rec, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                {rec.priority}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">{rec.action}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                                  <div>
                                    <span className="text-xs text-gray-500">Owner:</span>
                                    <div className="text-sm font-medium text-gray-700">{rec.owner}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Deadline:</span>
                                    <div className="text-sm font-medium text-gray-700">{rec.deadline}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Expected Outcome:</span>
                                    <div className="text-sm font-medium text-gray-700">{rec.expected_outcome}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Source Documents */}
                {report.sources && report.sources.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Source Documents ({report.total_sources || report.sources.length})
                    </h3>

                    <div className="space-y-4">
                      {report.sources.slice(0, 10).map((source, idx) => (
                        <div
                          key={idx}
                          onClick={() => source.document_id && handleSourceClick(source.document_id)}
                          className={`bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group ${source.document_id ? 'cursor-pointer' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                {source.from}
                              </div>
                              <div className="text-xs text-gray-500 flex gap-3">
                                {source.date && <span>{source.date}</span>}
                                {source.type && <span className="capitalize">{source.type}</span>}
                                {source.sender && <span>From: {source.sender}</span>}
                              </div>
                            </div>
                            {source.document_id && (
                              <button
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{source.text}</p>
                        </div>
                      ))}

                      {report.sources.length > 10 && (
                        <div className="text-center text-sm text-gray-500 pt-2">
                          + {report.sources.length - 10} more sources
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generation Info */}
                {report.generation_time_ms && (
                  <div className="text-center text-xs text-gray-400 mt-4">
                    Report generated in {(report.generation_time_ms / 1000).toFixed(2)}s
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportPDF}
                disabled={exporting || loading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveReport}
                disabled={saving || loading || saved}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Report
                  </>
                )}
              </Button>
            </div>
            <Button
              onClick={onClose}
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-[60] overflow-hidden" onClick={() => setSelectedDocument(null)}>
          <div className="absolute inset-0 bg-black bg-opacity-70 transition-opacity" />

          <div className="absolute inset-0 overflow-hidden flex items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Document Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex-1 mr-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedDocument.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="capitalize">{selectedDocument.source}</span>
                    {selectedDocument.sender_name && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedDocument.sender_name}
                      </span>
                    )}
                    {selectedDocument.created_at && (
                      <span>{new Date(selectedDocument.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  {selectedDocument.metadata?.subject && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Subject</div>
                      <div className="font-semibold text-gray-900">{selectedDocument.metadata.subject}</div>
                    </div>
                  )}

                  {selectedDocument.sender_address && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</div>
                      <div className="text-gray-900">
                        {selectedDocument.sender_name ? (
                          <span>{selectedDocument.sender_name} &lt;{selectedDocument.sender_address}&gt;</span>
                        ) : (
                          <span>{selectedDocument.sender_address}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDocument.to_addresses && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</div>
                      <div className="text-gray-900">
                        {Array.isArray(selectedDocument.to_addresses)
                          ? selectedDocument.to_addresses.join(', ')
                          : selectedDocument.to_addresses}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <SmartMarkdown content={selectedDocument.content || 'No content available'} />
                  </div>

                  {/* Attachments */}
                  {selectedDocument.attachments && selectedDocument.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm font-semibold text-gray-700 mb-3">
                        Attachments ({selectedDocument.attachments.length})
                      </div>
                      <div className="space-y-2">
                        {selectedDocument.attachments.map((attachment: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{attachment.title}</div>
                              {attachment.mime_type && (
                                <div className="text-xs text-gray-500">{attachment.mime_type}</div>
                              )}
                            </div>
                            {attachment.file_url && (
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                              >
                                Open
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 bg-white flex justify-end">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Document Overlay */}
      {loadingDocument && (
        <div className="fixed inset-0 z-[65] bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Loading document...</span>
          </div>
        </div>
      )}
    </div>
  );
}
