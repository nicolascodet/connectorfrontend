"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  datesWithReports: string[];
}

export default function ReportCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  datesWithReports
}: ReportCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty slots for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDateString = (day: number): string => {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateString = formatDateString(day);
    onDateSelect(dateString);
  };

  const isDateSelected = (day: number): boolean => {
    const dateString = formatDateString(day);
    return selectedDate === dateString;
  };

  const hasReport = (day: number): boolean => {
    const dateString = formatDateString(day);
    const hasIt = datesWithReports.includes(dateString);

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development' && day === 28) {
      console.log('Day 28 check:', {
        dateString,
        datesWithReports,
        hasIt
      });
    }

    return hasIt;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-normal">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Names Header */}
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {dayName}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const selected = isDateSelected(day);
          const today = isToday(day);
          const hasReports = hasReport(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={!hasReports}
              className={`
                aspect-square rounded-lg p-2 text-sm font-normal transition-all
                relative flex items-center justify-center
                ${selected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : hasReports
                  ? 'hover:bg-secondary cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed opacity-40'
                }
                ${today && !selected ? 'ring-2 ring-primary ring-offset-2' : ''}
              `}
            >
              <span>{day}</span>
              {hasReports && !selected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  <div className="w-1 h-1 rounded-full bg-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <div className="w-1 h-1 rounded-full bg-primary" />
          </div>
          <span>Has Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg ring-2 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
