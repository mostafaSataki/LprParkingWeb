"use client";

import React, { useState, useEffect } from "react";
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
// Simple Persian date formatter (avoiding the complex PersianDate class)
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

  // Mock data generation
  const generateMockReportData = (): ReportData => {
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
  };

  const generateMockSessionDetails = (): SessionDetail[] => {
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
  };

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setReportData(generateMockReportData());
      setSessionDetails(generateMockSessionDetails());
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExport = (format: string) => {
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
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} ساعت ${mins} دقیقه` : `${mins} دقیقه`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      "نقدی": "CASH",
      "کارت": "CARD", 
      "POS": "POS",
      "آنلاین": "ONLINE"
    };
    return method;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">داشبورد گزارش‌ها</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDateSimpleSimple(new Date(), "dddd، DD MMMM YYYY")}
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
                      {toPersianNumeralsSimpleSimple(reportData.totalRevenue.toLocaleString())} تومان
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
                      {toPersianNumeralsSimpleSimple(reportData.totalSessions)}
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
                      {toPersianNumeralsSimpleSimple(Math.floor(reportData.totalRevenue / reportData.totalSessions).toLocaleString())} تومان
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Tabs */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="sessions">جلسات</TabsTrigger>
            <TabsTrigger value="shifts">شیفت‌ها</TabsTrigger>
            <TabsTrigger value="analytics">تحلیل‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {reportData && (
              <>
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>روند درآمد روزانه</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.dailyRevenue.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">
                              {formatPersianDateSimple(day.date, "dddd، DD MMMM")}
                            </span>
                            <Badge variant="outline">
                              {toPersianNumeralsSimple(day.sessions)} جلسه
                            </Badge>
                          </div>
                          <span className="font-semibold text-green-600">
                            {toPersianNumeralsSimple(day.revenue.toLocaleString())} تومان
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>توزیع وسایل نقلیه</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.vehicleTypeDistribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span>{item.type}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {toPersianNumeralsSimple(item.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>توزیع روش‌های پرداخت</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportData.paymentMethodDistribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span>{item.method}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {toPersianNumeralsSimple(item.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>جزئیات جلسات پارکینگ</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>پلاک</TableHead>
                        <TableHead>ورود</TableHead>
                        <TableHead>خروج</TableHead>
                        <TableHead>مدت</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>روش پرداخت</TableHead>
                        <TableHead>اپراتور</TableHead>
                        <TableHead>نوع وسیله</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionDetails.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.plateNumber}</TableCell>
                          <TableCell>
                            {formatPersianDateSimple(session.entryTime, "HH:mm - YYYY/MM/DD")}
                          </TableCell>
                          <TableCell>
                            {session.exitTime 
                              ? formatPersianDateSimple(session.exitTime, "HH:mm")
                              : "—"
                            }
                          </TableCell>
                          <TableCell>{formatDuration(session.duration)}</TableCell>
                          <TableCell className="font-semibold">
                            {toPersianNumeralsSimple(session.amount.toLocaleString())} تومان
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getPaymentMethodLabel(session.paymentMethod)}
                            </Badge>
                          </TableCell>
                          <TableCell>{session.operator}</TableCell>
                          <TableCell>{session.vehicleType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-6">
            {reportData && (
              <Card>
                <CardHeader>
                  <CardTitle>گزارش شیفت‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.shiftReports.map((shift) => (
                      <div key={shift.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{shift.name}</h3>
                            <p className="text-sm text-gray-600">اپراتور: {shift.operator}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {toPersianNumeralsSimple(shift.totalRevenue.toLocaleString())} تومان
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatPersianDateSimple(shift.startTime, "HH:mm")} - {shift.endTime ? formatPersianDateSimple(shift.endTime, "HH:mm") : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>کل جلسات: {toPersianNumeralsSimple(shift.totalSessions)}</span>
                          <span>تکمیل شده: {toPersianNumeralsSimple(shift.completedSessions)}</span>
                          <span>نرخ تکمیل: {toPersianNumeralsSimple(Math.round((shift.completedSessions / shift.totalSessions) * 100))}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {reportData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>ساعات اوج ترافیک</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {reportData.peakHours.map((hour, index) => (
                        <Badge key={index} variant="secondary">
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>تحلیل عملکرد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">نشانگرهای کلیدی</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>نرخ اشغال پارکینگ:</span>
                            <span className="font-semibold">67%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>میانگین درآمد روزانه:</span>
                            <span className="font-semibold">
                              {toPersianNumeralsSimple(Math.floor(reportData.totalRevenue / 7).toLocaleString())} تومان
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>بیشترین روش پرداخت:</span>
                            <span className="font-semibold">نقدی (40%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>کارآمدترین شیفت:</span>
                            <span className="font-semibold">شیفت صبح</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">پیشنهادات بهبود</h4>
                        <div className="space-y-2 text-sm">
                          <p>• افزایش ظرفیت پارکینگ در ساعات اوج (8-9 صبح و 5-6 عصر)</p>
                          <p>• تشویق به استفاده از پرداخت‌های آنلاین برای کاهش صف</p>
                          <p>• بهینه‌سازی نیروی انسانی در شیفت‌های کم‌ترافیک</p>
                          <p>• ارائه تخفیف برای پارکینگ‌های طولانی‌مدت</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}