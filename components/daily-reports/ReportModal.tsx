"use client";

import { X, Download, Clock, Brain, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DailyReport {
  report_type: string;
  report_date: string;
  tenant_id: string;
  executive_summary: string;
  sections: Array<{
    title: string;
    content: string;
    sources: any[];
    evolution_note: string | null;
    order: number;
  }>;
  generated_at: string;
  generation_duration_ms: number;
  sub_questions_asked: string[];
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport;
}

export default function ReportModal({
  isOpen,
  onClose,
  report
}: ReportModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getReportTitle = (type: string) => {
    if (type === "client_relationships") return "Client Relationships";
    if (type === "operations") return "Operations";
    return type;
  };

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log("Export report:", report);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 space-y-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-normal mb-1">
                {getReportTitle(report.report_type)}
              </DialogTitle>
              <p className="text-muted-foreground font-light">
                {formatDate(report.report_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="font-normal"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <ScrollArea className="flex-1 p-6">
            {/* Executive Summary */}
            <div className="mb-8 p-6 bg-secondary/50 rounded-lg border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Executive Summary</h3>
              </div>
              <p className="text-sm leading-relaxed">{report.executive_summary}</p>
            </div>

            {/* Main Report Content (Markdown) */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-semibold mt-8 mb-4 flex items-center gap-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3 flex items-center gap-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-4 leading-relaxed text-sm" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="mb-4 space-y-2 list-disc list-inside" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="mb-4 space-y-2 list-decimal list-inside" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm leading-relaxed" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-foreground" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-border" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-2 bg-secondary text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-2 text-sm border-t" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) => (
                    inline
                      ? <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                      : <code className="block bg-secondary p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" {...props} />
                  ),
                }}
              >
                {report.sections[0]?.content || "No content available"}
              </ReactMarkdown>
            </div>

            {/* Evolution Note */}
            {report.sections[0]?.evolution_note && (
              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📝</span>
                  <h3 className="font-semibold text-lg">Evolution Note</h3>
                </div>
                <p className="text-sm leading-relaxed">{report.sections[0].evolution_note}</p>
              </div>
            )}
          </ScrollArea>

          {/* Sidebar */}
          <div className="w-80 border-l bg-secondary/20 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Report Info */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Report Info
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Generated At</p>
                    <p className="font-medium">{formatTime(report.generated_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Generation Time</p>
                    <p className="font-medium">{formatDuration(report.generation_duration_ms)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Report Type</p>
                    <Badge variant="secondary">{getReportTitle(report.report_type)}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Questions */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis ({report.sub_questions_asked.length})
                </h4>
                <div className="space-y-2">
                  {report.sub_questions_asked.map((question, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-background rounded-lg border text-xs leading-relaxed"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources (if available) */}
              {report.sections[0]?.sources && report.sections[0].sources.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Sources ({report.sections[0].sources.length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Source attribution coming soon
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
