"use client";

import { FileText, Clock, Briefcase, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface ReportCardsProps {
  clientReport: DailyReport | null;
  opsReport: DailyReport | null;
  onViewReport: (report: DailyReport) => void;
}

export default function ReportCards({
  clientReport,
  opsReport,
  onViewReport
}: ReportCardsProps) {
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

  const ReportCard = ({ report, icon: Icon, title, accentColor }: {
    report: DailyReport;
    icon: any;
    title: string;
    accentColor: string;
  }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${accentColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {report.sub_questions_asked.length} insights
          </Badge>
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Executive Summary Preview */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Executive Summary</p>
          <p className="text-sm line-clamp-3 leading-relaxed">
            {report.executive_summary}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Generated</p>
            <p className="text-sm font-medium">{formatTime(report.generated_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{formatDuration(report.generation_duration_ms)}</p>
          </div>
        </div>

        {/* Evolution Note */}
        {report.sections[0]?.evolution_note && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">📝 Evolution Note</p>
            <p className="text-xs line-clamp-2">{report.sections[0].evolution_note}</p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onViewReport(report)}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          variant="outline"
        >
          <FileText className="h-4 w-4 mr-2" />
          Read Full Report
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clientReport && (
        <ReportCard
          report={clientReport}
          icon={Briefcase}
          title="Client Relationships"
          accentColor="from-blue-500 to-blue-600"
        />
      )}

      {opsReport && (
        <ReportCard
          report={opsReport}
          icon={Settings}
          title="Operations"
          accentColor="from-orange-500 to-orange-600"
        />
      )}

      {/* Empty placeholder if only one report exists */}
      {clientReport && !opsReport && (
        <Card className="border-dashed opacity-50">
          <CardContent className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Operations report not available</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!clientReport && opsReport && (
        <Card className="border-dashed opacity-50">
          <CardContent className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Client relationships report not available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
