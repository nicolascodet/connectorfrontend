export interface DailyReport {
  report_type: string;
  report_date: string;
  tenant_id: string;
  executive_summary: string;
  sections: ReportSection[];
  generated_at: string;
  generation_duration_ms: number;
  sub_questions_asked: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  sources: any[];
  evolution_note: string | null;
  order: number;
}

export type ReportType = "client_relationships" | "operations";
