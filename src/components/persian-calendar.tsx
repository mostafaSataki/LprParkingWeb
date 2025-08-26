"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface Holiday {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  type: "OFFICIAL" | "RELIGIOUS" | "CUSTOM";
  description?: string;
}

interface PersianCalendarProps {
  year?: number;
  onHolidayChange?: (holidays: Holiday[]) => void;
  readOnly?: boolean;
}

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const PERSIAN_WEEKDAYS = ["ج", "ی", "د", "س", "چ", "پ", "ش"];

const HOLIDAY_TYPES = {
  OFFICIAL: { label: "رسمی", color: "bg-red-100 text-red-800 border-red-200" },
  RELIGIOUS: { label: "مذهبی", color: "bg-blue-100 text-blue-800 border-blue-200" },
  CUSTOM: { label: "سفارشی", color: "bg-green-100 text-green-800 border-green-200" },
  FRIDAY: { label: "جمعه", color: "bg-purple-100 text-purple-800 border-purple-200" }
};

export function PersianCalendar({ 
  year: propYear, 
  onHolidayChange, 
  readOnly = false 
}: PersianCalendarProps) {
  const [currentYear, setCurrentYear] = useState(propYear || new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayType, setNewHolidayType] = useState<"OFFICIAL" | "RELIGIOUS" | "CUSTOM">("OFFICIAL");
  const [newHolidayDescription, setNewHolidayDescription] = useState("");

  // Load holidays from database
  useEffect(() => {
    loadHolidays();
  }, [currentYear]);

  const loadHolidays = async () => {
    try {
      const response = await fetch(`/api/holidays?year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        // Convert date strings back to Date objects
        const holidaysWithDates = data.map((holiday: any) => ({
          ...holiday,
          date: new Date(holiday.date)
        }));
        setHolidays(holidaysWithDates);
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  // Notify parent component of holiday changes
  useEffect(() => {
    if (onHolidayChange) {
      onHolidayChange(holidays);
    }
  }, [holidays, onHolidayChange]);

  // Convert Gregorian to Persian date
  const toPersianDate = (gregorianDate: Date): { year: number; month: number; day: number } => {
    // Validate that gregorianDate is a proper Date object
    if (!gregorianDate || !(gregorianDate instanceof Date) || isNaN(gregorianDate.getTime())) {
      return { year: 0, month: 0, day: 0 };
    }
    
    // Simple conversion - in a real app, you'd use a proper Persian date library
    const persianYear = gregorianDate.getFullYear() - 621;
    const persianMonth = gregorianDate.getMonth() + 1;
    const persianDay = gregorianDate.getDate();
    
    return { year: persianYear, month: persianMonth, day: persianDay };
  };

  // Convert Persian to Gregorian date
  const toGregorianDate = (persianYear: number, persianMonth: number, persianDay: number): Date => {
    // Simple conversion - in a real app, you'd use a proper Persian date library
    const gregorianYear = persianYear + 621;
    const gregorianMonth = persianMonth - 1;
    const gregorianDay = persianDay;
    
    return new Date(gregorianYear, gregorianMonth, gregorianDay);
  };

  // Get days in Persian month
  const getDaysInPersianMonth = (year: number, month: number): number => {
    const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    if (month === 11 && isPersianLeapYear(year)) {
      return 30;
    }
    return daysInMonth[month - 1];
  };

  // Check if Persian year is leap year
  const isPersianLeapYear = (year: number): boolean => {
    const leaps = [1, 5, 9, 13, 17, 22, 26, 30];
    const cycle = year % 33;
    return leaps.includes(cycle);
  };

  // Get starting weekday of Persian month (adjusted for Friday start)
  const getStartingWeekday = (year: number, month: number): number => {
    const firstDay = toGregorianDate(year, month, 1);
    let gregorianDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    // Convert to Persian week where Friday = 0, Saturday = 6
    return (gregorianDay + 2) % 7;
  };

  // Check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    // Validate that date is a proper Date object
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return false;
    }
    
    const persianDate = toPersianDate(date);
    
    // Check if it's Friday (day 0 in Persian calendar where Friday=0)
    const weekday = date.getDay();
    if (weekday === 5) return true; // Friday
    
    // Check custom holidays
    return holidays.some(holiday => {
      const holidayPersian = toPersianDate(holiday.date);
      return (
        holidayPersian.year === persianDate.year &&
        holidayPersian.month === persianDate.month &&
        holidayPersian.day === persianDate.day
      );
    });
  };

  // Get holiday for a specific date
  const getHolidayForDate = (date: Date): Holiday | null => {
    // Validate that date is a proper Date object
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    const persianDate = toPersianDate(date);
    
    // Check if it's Friday
    const weekday = date.getDay();
    if (weekday === 5) {
      return {
        id: `friday-${date.getTime()}`,
        name: "جمعه",
        date: date,
        isRecurring: true,
        type: "FRIDAY" as const
      };
    }
    
    // Check custom holidays
    return holidays.find(holiday => {
      const holidayPersian = toPersianDate(holiday.date);
      return (
        holidayPersian.year === persianDate.year &&
        holidayPersian.month === persianDate.month &&
        holidayPersian.day === persianDate.day
      );
    }) || null;
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    if (readOnly) return;
    
    const weekday = date.getDay();
    if (weekday === 5) return; // Can't modify Friday holidays
    
    setSelectedDate(date);
    setIsAddingHoliday(true);
  };

  // Add new holiday
  const handleAddHoliday = async () => {
    if (!selectedDate || !newHolidayName.trim()) return;
    
    try {
      const holidayData = {
        name: newHolidayName.trim(),
        date: selectedDate.toISOString(),
        isRecurring: false,
        type: newHolidayType,
        description: newHolidayDescription.trim() || undefined
      };
      
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holidayData),
      });
      
      if (response.ok) {
        await loadHolidays();
        setIsAddingHoliday(false);
        setNewHolidayName("");
        setNewHolidayDescription("");
        setSelectedDate(null);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  // Remove holiday
  const handleRemoveHoliday = async (holidayId: string) => {
    try {
      const response = await fetch(`/api/holidays/${holidayId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadHolidays();
      }
    } catch (error) {
      console.error('Error removing holiday:', error);
    }
  };

  // Generate calendar data for all months
  const calendarData = useMemo(() => {
    const data = [];
    
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = getDaysInPersianMonth(currentYear, month);
      const startingWeekday = getStartingWeekday(currentYear, month);
      
      const monthData = {
        month,
        monthName: PERSIAN_MONTHS[month - 1],
        weeks: []
      };
      
      let currentWeek: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];
      let dayCounter = 1;
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingWeekday; i++) {
        currentWeek.push({ date: new Date(), day: 0, isCurrentMonth: false });
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = toGregorianDate(currentYear, month, day);
        currentWeek.push({ date, day, isCurrentMonth: true });
        
        if (currentWeek.length === 7) {
          monthData.weeks.push([...currentWeek]);
          currentWeek = [];
        }
      }
      
      // Add remaining cells to complete the last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push({ date: new Date(), day: 0, isCurrentMonth: false });
        }
        monthData.weeks.push([...currentWeek]);
      }
      
      data.push(monthData);
    }
    
    return data;
  }, [currentYear]);

  // Navigate to previous/next year
  const navigateYear = (direction: "prev" | "next") => {
    setCurrentYear(prev => direction === "prev" ? prev - 1 : prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تقویم تعطیلات سال {toPersianNumerals(currentYear.toString())}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear("prev")}
              >
                <ChevronRight className="h-4 w-4" />
                سال قبل
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear("next")}
              >
                سال بعد
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {calendarData.slice(0, 6).reverse().map((monthData) => (
                <Card key={monthData.month} className="text-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">
                      {monthData.monthName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {PERSIAN_WEEKDAYS.map((day, index) => (
                        <div
                          key={day}
                          className={`text-center text-xs font-medium p-1 ${
                            index === 0 ? "text-red-600" : "" // Friday in red
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="space-y-1">
                      {monthData.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-1">
                          {week.map((dayInfo, dayIndex) => {
                            const holiday = dayInfo.isCurrentMonth ? getHolidayForDate(dayInfo.date) : null;
                            const isFriday = dayInfo.isCurrentMonth && dayInfo.date.getDay() === 5;
                            
                            return (
                              <div
                                key={dayIndex}
                                className={`
                                  relative p-1 text-center cursor-pointer rounded transition-colors
                                  ${dayInfo.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400"}
                                  ${isFriday ? "bg-red-50" : ""}
                                  ${holiday && holiday.type !== "FRIDAY" ? "bg-gray-100" : ""}
                                `}
                                onClick={() => dayInfo.isCurrentMonth && handleDayClick(dayInfo.date)}
                              >
                                {dayInfo.day > 0 && (
                                  <>
                                    <div className={`text-xs ${isFriday ? "text-red-600 font-medium" : ""}`}>
                                      {toPersianNumerals(dayInfo.day.toString())}
                                    </div>
  
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {calendarData.slice(6).reverse().map((monthData) => (
                <Card key={monthData.month} className="text-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-base">
                      {monthData.monthName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {PERSIAN_WEEKDAYS.map((day, index) => (
                        <div
                          key={day}
                          className={`text-center text-xs font-medium p-1 ${
                            index === 0 ? "text-red-600" : "" // Friday in red
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="space-y-1">
                      {monthData.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-1">
                          {week.map((dayInfo, dayIndex) => {
                            const holiday = dayInfo.isCurrentMonth ? getHolidayForDate(dayInfo.date) : null;
                            const isFriday = dayInfo.isCurrentMonth && dayInfo.date.getDay() === 5;
                            
                            return (
                              <div
                                key={dayIndex}
                                className={`
                                  relative p-1 text-center cursor-pointer rounded transition-colors
                                  ${dayInfo.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400"}
                                  ${isFriday ? "bg-red-50" : ""}
                                  ${holiday && holiday.type !== "FRIDAY" ? "bg-gray-100" : ""}
                                `}
                                onClick={() => dayInfo.isCurrentMonth && handleDayClick(dayInfo.date)}
                              >
                                {dayInfo.day > 0 && (
                                  <>
                                    <div className={`text-xs ${isFriday ? "text-red-600 font-medium" : ""}`}>
                                      {toPersianNumerals(dayInfo.day.toString())}
                                    </div>
  
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holiday List */}
      <Card>
        <CardHeader>
          <CardTitle>تعطیلات تعریف شده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {holidays.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                هیچ تعطیلی تعریف نشده است
              </p>
            ) : (
              holidays
                .sort((a, b) => {
                  // Safe sorting with validation
                  const dateA = a.date instanceof Date ? a.date.getTime() : 0;
                  const dateB = b.date instanceof Date ? b.date.getTime() : 0;
                  return dateA - dateB;
                })
                .map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={HOLIDAY_TYPES[holiday.type].color}>
                        {HOLIDAY_TYPES[holiday.type].label}
                      </Badge>
                      <div>
                        <div className="font-medium">{holiday.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatPersianDate(holiday.date, "YYYY/MM/DD")}
                          {holiday.description && (
                            <span className="mr-2">- {holiday.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveHoliday(holiday.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Holiday Modal */}
      {isAddingHoliday && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>افزودن تعطیلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  تاریخ: {formatPersianDate(selectedDate, "YYYY/MM/DD")}
                </AlertDescription>
              </Alert>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  نام تعطیلی
                </label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام تعطیلی را وارد کنید"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع تعطیلی
                </label>
                <select
                  value={newHolidayType}
                  onChange={(e) => setNewHolidayType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OFFICIAL">رسمی</option>
                  <option value="RELIGIOUS">مذهبی</option>
                  <option value="CUSTOM">سفارشی</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="توضیحات تعطیلی را وارد کنید"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAddHoliday}
                  disabled={!newHolidayName.trim()}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن تعطیلی
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingHoliday(false);
                    setNewHolidayName("");
                    setNewHolidayDescription("");
                    setSelectedDate(null);
                  }}
                >
                  انصراف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}