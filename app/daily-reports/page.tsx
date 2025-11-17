"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestDailyReports, getDailyReport } from "@/lib/api";
import ReportCalendar from "@/components/daily-reports/ReportCalendar";
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      loadReportsForDate(selectedDate);
    }
  }, [selectedDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
        setModalReport(null);
        return;
      }

      // Don't handle shortcuts if modal is open or if typing in an input
      if (modalOpen || (e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }

      // Arrow keys for date navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateDay('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateDay('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, reportsIndex, modalOpen]);

  const loadReportsIndex = async () => {
    try {
      setLoading(true);
      const result = await getLatestDailyReports(30);

      // Extract unique dates from reports
      const dates = [...new Set(result.reports?.map((r: any) => r.report_date as string) || [])] as string[];
      setReportsIndex(dates);

      // Default to most recent date
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
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

      // Fetch both report types
      const [clientResult, opsResult] = await Promise.allSettled([
        getDailyReport(date, "client_relationships"),
        getDailyReport(date, "operations")
      ]);

      if (clientResult.status === "fulfilled" && clientResult.value.success) {
        setClientReport(clientResult.value.report);
      }

      if (opsResult.status === "fulfilled" && opsResult.value.success) {
        setOpsReport(opsResult.value.report);
      }
    } catch (error) {
      console.error("Failed to load reports for date:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleViewReport = (report: DailyReport) => {
    setModalReport(report);
    setModalOpen(true);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;

    const currentIndex = reportsIndex.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex < reportsIndex.length - 1) {
      setSelectedDate(reportsIndex[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(reportsIndex[currentIndex - 1]);
    }
  };

  const canNavigatePrev = selectedDate && reportsIndex.indexOf(selectedDate) < reportsIndex.length - 1;
  const canNavigateNext = selectedDate && reportsIndex.indexOf(selectedDate) > 0;

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F9F9F9' }}>
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-normal mb-2">Daily Reports</h1>
              <p className="text-muted-foreground font-light">Automated daily intelligence reports</p>
            </div>
            <Button onClick={() => router.push("/")} className="font-normal">
              Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Calendar Component */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <ReportCalendar
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    datesWithReports={reportsIndex}
                  />
                </CardContent>
              </Card>

              {/* Selected Date Reports */}
              {selectedDate && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-normal">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
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
                    <Card className="p-16 text-center">
                      <Calendar className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-2xl font-normal mb-3">No Reports for This Date</h3>
                      <p className="text-muted-foreground font-light mb-8 text-base">
                        Reports are generated automatically at 6:00 AM each business day
                      </p>
                      <Button onClick={() => setSelectedDate(reportsIndex[0] || null)} variant="outline">
                        View Latest Reports
                      </Button>
                    </Card>
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
                <Card className="p-16 text-center">
                  <Calendar className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-normal mb-3">No Daily Reports Yet</h3>
                  <p className="text-muted-foreground font-light mb-8 text-base">
                    Daily reports are generated automatically at 6:00 AM each day
                  </p>
                </Card>
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
