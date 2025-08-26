"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Search, 
  Calendar, 
  DollarSign, 
  Car,
  Clock,
  Users,
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  Filter
} from "lucide-react";

// Simple Persian date formatter
function formatPersianDateSimple(date: Date | string, format: string = "YYYY/MM/DD HH:mm"): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('fa-IR', options).format(dateObj);
}

function toPersianNumeralsSimple(num: number | string): string {
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
}

interface ReportData {
  totalRevenue: number;
  totalSessions: number;
  averageDuration: number;
  peakHours: string[];
  vehicleTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  paymentMethodDistribution: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    sessions: number;
  }[];
  shiftReports: {
    id: string;
    name: string;
    operator: string;
    startTime: string;
    endTime?: string;
    totalRevenue: number;
    totalSessions: number;
    completedSessions: number;
  }[];
}

interface SessionDetail {
  id: string;
  plateNumber: string;
  entryTime: string;
  exitTime?: string;
  duration: number;
  amount: number;
  paymentMethod: string;
  operator: string;
  vehicleType: string;
}

// Mock data generation functions
function generateMockReportData(): ReportData {
  return {
    totalRevenue: 12500000,
    totalSessions: 450,
    averageDuration: 120,
    peakHours: ["08:00", "09:00", "17:00", "18:00"],
    vehicleTypeDistribution: [
      { type: "خودرو", count: 350, percentage: 77.8 },
      { type: "موتورسیکلت", count: 80, percentage: 17.8 },
      { type: "وانت", count: 20, percentage: 4.4 }
    ],
    paymentMethodDistribution: [
      { method: "نقدی", amount: 5000000, percentage: 40 },
      { method: "کارت", amount: 3750000, percentage: 30 },
      { method: "POS", amount: 2500000, percentage: 20 },
      { method: "آنلاین", amount: 1250000, percentage: 10 }
    ],
    dailyRevenue: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      revenue: Math.floor(Math.random() * 2000000) + 1000000,
      sessions: Math.floor(Math.random() * 80) + 40
    })),
    shiftReports: [
      {
        id: "1",
        name: "شیفت صبح",
        operator: "علی رضایی",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 3200000,
        totalSessions: 85,
        completedSessions: 82
      },
      {
        id: "2",
        name: "شیفت عصر",
        operator: "مریم احمدی",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 2800000,
        totalSessions: 75,
        completedSessions: 73
      }
    ]
  };
}

function generateMockSessionDetails(): SessionDetail[] {
  const plates = ["۱۲۳۴۵۶۷۸", "۸۷۶۵۴۳۲۱", "۱۱۱۲۲۳۳", "۴۴۴۴۴۴۴", "۵۵۵۵۵۵۵", "۶۶۶۶۶۶۶", "۷۷۷۷۷۷۷", "۹۹۹۹۹۹۹"];
  const operators = ["علی رضایی", "مریم احمدی", "حسن محمدی", "زهرا حسینی"];
  const vehicleTypes = ["خودرو", "موتورسیکلت", "وانت"];
  const paymentMethods = ["نقدی", "کارت", "POS", "آنلاین"];

  return Array.from({ length: 50 }, (_, i) => {
    const entryTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 480) + 30; // 30 minutes to 8 hours
    const exitTime = new Date(entryTime.getTime() + duration * 60 * 1000);
    const amount = Math.floor(Math.random() * 50000) + 5000;

    return {
      id: (i + 1).toString(),
      plateNumber: plates[Math.floor(Math.random() * plates.length)],
      entryTime: entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      duration,
      amount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
    };
  });
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  });
  const [reportType, setReportType] = useState("overview");
  const [exportFormat, setExportFormat] = useState("csv");

  // Load data using a different approach
  const loadData = useCallback(() => {
    try {
      const data = generateMockReportData();
      const details = generateMockSessionDetails();
      setReportData(data);
      setSessionDetails(details);
      setLoading(false);
    } catch (err) {
      console.error("Error loading report data:", err);
      setError("خطا در بارگذاری داده‌ها");
      setLoading(false);
    }
  }, []);

  // Use setTimeout instead of useEffect
  if (loading && typeof window !== 'undefined') {
    setTimeout(loadData, 1000);
  }

  const handleExport = useCallback((format: string) => {
    if (!reportData) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "csv") {
      // Export overview as CSV
      content = "تاریخ,درآمد,تعداد جلسات,میانگین مدت زمان\n";
      reportData.dailyRevenue.forEach(day => {
        content += `${formatPersianDateSimple(day.date, "YYYY/MM/DD")},${day.revenue},${day.sessions},${Math.floor(reportData.averageDuration)}\n`;
      });
      filename = `گزارش_درآمد_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.csv`;
      mimeType = "text/csv";
    } else if (format === "json") {
      // Export as JSON
      content = JSON.stringify(reportData, null, 2);
      filename = `گزارش_کامل_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reportData]);

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} ساعت ${mins} دقیقه` : `${mins} دقیقه`;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">داشبورد گزارش‌ها</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDateSimple(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleExport(exportFormat)}>
              <Download className="h-4 w-4 ml-2" />
              خروجی
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">بازه زمانی:</span>
              </div>
              <Input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, startDate: new Date(e.target.value) })}
                placeholder="تاریخ شروع"
              />
              <span className="text-gray-500">تا</span>
              <Input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, endDate: new Date(e.target.value) })}
                placeholder="تاریخ پایان"
              />
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ml-2" />
                اعمال فیلتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل درآمد</p>
                    <p className="text-2xl font-bold text-green-600">
                      {toPersianNumeralsSimple(reportData.totalRevenue.toLocaleString())} تومان
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل جلسات</p>
                    <p className="text-2xl font-bold">
                      {toPersianNumeralsSimple(reportData.totalSessions)}
                    </p>
                  </div>
                  <Car className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">میانگین مدت</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(reportData.averageDuration)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">میانگین درآمد</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {toPersianNumeralsSimple(Math.floor(reportData.totalRevenue / reportData.totalSessions).toLocaleString())} تومان
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-green-600">✓ گزارش‌ها با موفقیت بارگذاری شدند</h2>
            <p>سیستم گزارش‌دهی هم اکنون آماده استفاده است.</p>
            {reportData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">خلاصه آمار:</h3>
                  <ul className="mt-2 space-y-1">
                    <li>• کل درآمد: {toPersianNumeralsSimple(reportData.totalRevenue.toLocaleString())} تومان</li>
                    <li>• کل جلسات: {toPersianNumeralsSimple(reportData.totalSessions)}</li>
                    <li>• میانگین مدت زمان: {formatDuration(reportData.averageDuration)}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">توزیع وسایل نقلیه:</h3>
                  <ul className="mt-2 space-y-1">
                    {reportData.vehicleTypeDistribution.map((item, index) => (
                      <li key={index}>• {item.type}: {toPersianNumeralsSimple(item.count)} ({toPersianNumeralsSimple(item.percentage)}%)</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}