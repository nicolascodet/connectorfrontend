"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLatestDailyReports, getAllDailyReportsForDate } from "@/lib/api";
import ReportCards from "@/components/daily-reports/ReportCards";
import ReportModal from "@/components/daily-reports/ReportModal";

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

export default function DailyReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportsIndex, setReportsIndex] = useState<string[]>([]); // dates with reports
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Reports for selected date
  const [clientReport, setClientReport] = useState<DailyReport | null>(null);
  const [opsReport, setOpsReport] = useState<DailyReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReport, setModalReport] = useState<DailyReport | null>(null);

  useEffect(() => {
    loadReportsIndex();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateString = formatDateToString(selectedDate);
      loadReportsForDate(dateString);
    }
  }, [selectedDate]);

  const formatDateToString = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadReportsIndex = async () => {
    try {
      setLoading(true);
      const result = await getLatestDailyReports(90);

      if (process.env.NODE_ENV === 'development') {
        console.log('API Response:', result);
      }

      // Extract unique dates from reports
      const dates = [...new Set(result.reports?.map((r: any) => r.report_date as string) || [])] as string[];

      if (process.env.NODE_ENV === 'development') {
        console.log('Extracted dates:', dates);
      }

      setReportsIndex(dates);

      // Default to most recent date
      if (dates.length > 0) {
        const mostRecentDate = new Date(dates[0] + 'T00:00:00');
        setSelectedDate(mostRecentDate);
      }
    } catch (error) {
      console.error("Failed to load reports index:", error);
      setReportsIndex([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReportsForDate = async (date: string) => {
    try {
      setLoadingReports(true);
      setClientReport(null);
      setOpsReport(null);

      console.log('🔍 Loading all reports for date:', date);
      console.log('👤 Current user:', user);
      console.log('🔑 User ID:', user?.id);

      // Fetch all reports for this date in one call
      const result = await getAllDailyReportsForDate(date);

      console.log('📊 API response:', result);

      if (result.success && result.reports) {
        console.log(`✅ Found ${result.reports.length} report(s) for ${date}`);

        // Parse reports by type
        result.reports.forEach((report: any) => {
          console.log('📄 Report:', {
            type: report.report_type,
            date: report.report_date,
            has_full_report: !!report.full_report,
            full_report_type: typeof report.full_report
          });

          if (report.full_report) {
            // Parse full_report if it's a string
            const fullReport = typeof report.full_report === 'string'
              ? JSON.parse(report.full_report)
              : report.full_report;

            console.log('✅ Parsed full_report:', fullReport);

            if (report.report_type === "client_relationships") {
              setClientReport(fullReport);
            } else if (report.report_type === "operations") {
              setOpsReport(fullReport);
            }
          }
        });
      } else {
        console.log('ℹ️ No reports found for this date');
      }
    } catch (error) {
      console.error("❌ Failed to load reports for date:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const handleViewReport = (report: DailyReport) => {
    setModalReport(report);
    setModalOpen(true);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;

    const currentDateString = formatDateToString(selectedDate);
    const currentIndex = reportsIndex.indexOf(currentDateString);

    if (direction === 'prev' && currentIndex < reportsIndex.length - 1) {
      const prevDate = new Date(reportsIndex[currentIndex + 1] + 'T00:00:00');
      setSelectedDate(prevDate);
    } else if (direction === 'next' && currentIndex > 0) {
      const nextDate = new Date(reportsIndex[currentIndex - 1] + 'T00:00:00');
      setSelectedDate(nextDate);
    }
  };

  const canNavigatePrev = selectedDate && reportsIndex.indexOf(formatDateToString(selectedDate)) < reportsIndex.length - 1;
  const canNavigateNext = selectedDate && reportsIndex.indexOf(formatDateToString(selectedDate)) > 0;

  // Modifier for dates with reports
  const modifiers = {
    hasReport: reportsIndex.map(dateStr => new Date(dateStr + 'T00:00:00'))
  };

  const modifiersStyles = {
    hasReport: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      textDecorationColor: '#007AFF',
      textDecorationThickness: '2px',
      textUnderlineOffset: '4px'
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-normal mb-2">Daily Reports</h1>
              <p className="text-muted-foreground font-light">Automated daily intelligence reports</p>
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="font-normal">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  captionLayout="dropdown"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                />
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Selected Date Reports */}
              {selectedDate && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-normal">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDay('prev')}
                        disabled={!canNavigatePrev}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous Day
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDay('next')}
                        disabled={!canNavigateNext}
                      >
                        Next Day
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {loadingReports ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : !clientReport && !opsReport ? (
                    <div className="p-16 text-center border rounded-lg">
                      <CalendarIcon className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-2xl font-normal mb-3">No Reports for This Date</h3>
                      <p className="text-muted-foreground font-light mb-8 text-base">
                        Reports are generated automatically at 6:00 AM each business day
                      </p>
                      <Button onClick={() => setCalendarOpen(true)} variant="outline">
                        Pick Another Date
                      </Button>
                    </div>
                  ) : (
                    <ReportCards
                      clientReport={clientReport}
                      opsReport={opsReport}
                      onViewReport={handleViewReport}
                    />
                  )}
                </>
              )}

              {/* Empty State - No reports at all */}
              {!loading && reportsIndex.length === 0 && (
                <div className="p-16 text-center border rounded-lg">
                  <CalendarIcon className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-normal mb-3">No Daily Reports Yet</h3>
                  <p className="text-muted-foreground font-light mb-8 text-base">
                    Daily reports are generated automatically at 6:00 AM each day
                  </p>
                </div>
              )}
            </>
          )}

          {/* Report Modal */}
          {modalReport && (
            <ReportModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setModalReport(null);
              }}
              report={modalReport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
