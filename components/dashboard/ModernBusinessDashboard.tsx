"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestInsights, generateInsights, investigateAlert } from "@/lib/api";
import {
  Brain, RefreshCw, Sparkles, ArrowUp, ArrowDown, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign, Activity, Send
} from "lucide-react";
import DrillDownModal from "./DrillDownModal";
import AlertsWidget from "./AlertsWidget";
import SmartMarkdown from "@/components/SmartMarkdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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
  onModalOpenChange?: (isOpen: boolean) => void;
  chatInput: string;
  setChatInput: (value: string) => void;
  onChatSubmit: (e: React.FormEvent) => void;
}

export default function ModernBusinessDashboard({ user, onModalOpenChange, chatInput, setChatInput, onChatSubmit }: ModernBusinessDashboardProps) {
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

  useEffect(() => {
    onModalOpenChange?.(modalOpen);
  }, [modalOpen, onModalOpenChange]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const result = await getLatestInsights("daily", 10);

      if (result.insights && result.insights.length > 0) {
        const parsed = result.insights.map((insight: any) => {
          let structured_data = insight.structured_data || [];

          if (typeof structured_data === 'string') {
            try {
              structured_data = JSON.parse(structured_data);
            } catch (e) {
              console.error('Failed to parse structured_data:', e);
              structured_data = [];
            }
          }

          if (structured_data && typeof structured_data === 'object' && structured_data.type === 'array' && structured_data.items) {
            structured_data = structured_data.items;
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

      // Trigger alert detection on last 10 documents
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/alerts/backfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ limit: 10 })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger alert detection');
      }

      // Also regenerate insights
      await generateInsights();

      alert("Generating alerts and insights... This may take a few minutes. Refresh to see updates.");

      // Reload data after a short delay
      setTimeout(() => {
        loadInsights();
      }, 2000);
    } catch (error) {
      console.error("Failed:", error);
      alert("Failed to trigger regeneration. Please try again.");
    } finally {
      setGenerating(false);
    }
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

  const allWidgets: Widget[] = [];
  insights.forEach(insight => {
    if (Array.isArray(insight.structured_data)) {
      insight.structured_data.forEach(widget => {
        if (widget && widget.title && widget.message && widget.message.trim() !== '' && widget.message !== 'No details available') {
          allWidgets.push(widget);
        }
      });
    }
  });

  const displayWidgets = allWidgets.slice(-6);

  const getUrgencyVariant = (urgency: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <TrendingUp className="h-4 w-4" />;
      case "medium": return <Activity className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const renderWidget = (widget: Widget, idx: number) => {
    const hasValue = widget.value && widget.value !== "null" && widget.value.trim() !== "";

    return (
      <Card
        key={idx}
        className="cursor-pointer hover:shadow-md transition-shadow group"
        onClick={() => handleWidgetClick(widget)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {widget.title || 'Insight'}
              </CardTitle>
            </div>
            <Badge variant={getUrgencyVariant(widget.urgency)} className="flex items-center gap-1">
              {getUrgencyIcon(widget.urgency)}
              <span className="capitalize font-medium">{widget.urgency || 'Medium'}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {hasValue && (
            <div className="mb-4">
              <div className="text-3xl font-semibold">{widget.value}</div>
              {widget.value_label && (
                <p className="text-sm text-muted-foreground font-light mt-1">{widget.value_label}</p>
              )}
            </div>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed font-normal">
            <SmartMarkdown content={widget.message || 'No details available'} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (allWidgets.length === 0) {
    return (
      <Card className="p-16 text-center">
        <Brain className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-2xl font-semibold mb-3">No Insights Yet</h3>
        <p className="text-muted-foreground mb-8 text-base font-light">
          Generate AI-powered insights from your communications
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="font-medium"
        >
          {generating ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {generating ? "Generating..." : "Generate Insights"}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            What are you working on today?
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-2">
            Search, analyze, and discover insights across your entire business
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={onChatSubmit}>
          <div className="relative transition-all duration-300 ease-in-out">
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-gray-800/10 to-black/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-300">
              <div className="flex items-end gap-3 p-4">
                <textarea
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onChatSubmit(e);
                    }
                  }}
                  placeholder="Ask me anything"
                  className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-sm resize-none max-h-[400px] overflow-y-auto leading-tight"
                  rows={1}
                  style={{ height: '20px', lineHeight: '20px' }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Insights</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="high">High Priority</TabsTrigger>
              </TabsList>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="outline"
                className="font-medium"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {displayWidgets.map((widget, idx) => renderWidget(widget, idx))}
              </div>
            </TabsContent>
            <TabsContent value="critical" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {displayWidgets.filter(w => w.urgency?.toLowerCase() === 'critical').map((widget, idx) => renderWidget(widget, idx))}
              </div>
            </TabsContent>
            <TabsContent value="high" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {displayWidgets.filter(w => w.urgency?.toLowerCase() === 'high').map((widget, idx) => renderWidget(widget, idx))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <AlertsWidget onInvestigate={handleAlertInvestigate} investigating={investigating} />
        </div>
      </div>

      {modalOpen && selectedWidget && (
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
