"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Filter,
  Eye,
  User,
  Phone,
  Mail,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
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
  status: string;
}

interface CustomerHistory {
  plateNumber: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  visits: Array<{
    entryTime: string;
    exitTime?: string;
    duration: number;
    amount: number;
    vehicleType: string;
    paymentMethod: string;
    operator: string;
  }>;
  totalVisits: number;
  totalSpent: number;
  averageDuration: number;
  lastVisit: string;
}

// Mock data generation functions
function generateMockSessionDetails(): SessionDetail[] {
  const plates = ["۱۲۳۴۵۶۷۸", "۸۷۶۵۴۳۲۱", "۱۱۱۲۲۳۳", "۴۴۴۴۴۴۴", "۵۵۵۵۵۵۵", "۶۶۶۶۶۶۶", "۷۷۷۷۷۷۷", "۹۹۹۹۹۹۹", "۱۲۳اب۱۲", "ب۴۵۶۷۸۹", "۷۸۹۱۰۱۱۱", "۲۱۲۱۳۱۴۱", "۵۱۶۱۷۱۸۱", "۹۲۰۲۱۲۲۲", "۳۳۴۴۵۵۶۶", "۷۷۸۸۹۹۰۰"];
  const operators = ["علی رضایی", "مریم احمدی", "حسن محمدی", "زهرا حسینی", "محمد تقوی", "فاطمه صالحی", "رضا کریمی", "سارا اکبری"];
  const vehicleTypes = ["خودرو", "موتورسیکلت", "وانت", "اتوبوس", "کامیون"];
  const paymentMethods = ["نقدی", "کارت", "POS", "آنلاین", "کارت به کارت"];
  const statuses = ["COMPLETED", "ACTIVE", "CANCELLED"];

  return Array.from({ length: 50 }, (_, i) => {
    const entryTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 720) + 15; // 15 minutes to 12 hours
    const exitTime = new Date(entryTime.getTime() + duration * 60 * 1000);
    const amount = Math.floor(Math.random() * 150000) + 3000; // 3,000 to 150,000

    return {
      id: (i + 1).toString(),
      plateNumber: plates[Math.floor(Math.random() * plates.length)],
      entryTime: entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      duration,
      amount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    };
  });
}

function generateCustomerHistory(plateNumber: string): CustomerHistory {
  const operators = ["علی رضایی", "مریم احمدی", "حسن محمدی", "زهرا حسینی", "محمد تقوی", "فاطمه صالحی"];
  const vehicleTypes = ["خودرو", "موتورسیکلت", "وانت", "اتوبوس"];
  const paymentMethods = ["نقدی", "کارت", "POS", "آنلاین", "کارت به کارت"];
  
  // Generate realistic customer names based on plate number
  const customerNames = [
    "احمد محمدی", "رضا تقوی", "فاطمه حسینی", "زهرا اکبری", "علی رضایی",
    "مریم احمدی", "حسن صالحی", "سارا کریمی", "محمد جوادی", "فاطمه هاشمی"
  ];
  
  const customerPhones = [
    "۰۹۱۲۳۴۵۶۷۸۹", "۰۹۱۵۶۷۸۹۰۱", "۰۹۱۸۹۰۱۲۳۴", "۰۹۲۱۲۳۴۵۶۷", "۰۹۳۴۵۶۷۸۹۰",
    "۰۹۱۰۹۸۷۶۵۴", "۰۹۱۳۴۵۶۷۸۹", "۰۹۱۶۷۸۹۰۱۲", "۰۹۱۹۲۳۴۵۶۷", "۰۹۲۲۳۴۵۶۷۸"
  ];
  
  const customerEmails = [
    "ahmad.mohammadi@email.com", "reza.taghavi@email.com", "fatemeh.hosseini@email.com",
    "zahra.akhbari@email.com", "ali.rezaei@email.com", "maryam.ahmadi@email.com",
    "hasan.salehi@email.com", "sara.karimi@email.com", "mohammad.javadi@email.com",
    "fatemeh.hashemi@email.com"
  ];
  
  const nameIndex = Math.floor(Math.random() * customerNames.length);
  
  const visits = Array.from({ length: Math.floor(Math.random() * 15) + 5 }, (_, i) => {
    const entryTime = new Date(Date.now() - (i + 1) * Math.random() * 90 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 480) + 30;
    const exitTime = new Date(entryTime.getTime() + duration * 60 * 1000);
    const amount = Math.floor(Math.random() * 80000) + 5000;

    return {
      entryTime: entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      duration,
      amount,
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      operator: operators[Math.floor(Math.random() * operators.length)]
    };
  });

  return {
    plateNumber,
    customerInfo: {
      name: customerNames[nameIndex],
      phone: customerPhones[nameIndex],
      email: customerEmails[nameIndex]
    },
    visits: visits.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()),
    totalVisits: visits.length,
    totalSpent: visits.reduce((sum, visit) => sum + visit.amount, 0),
    averageDuration: Math.floor(visits.reduce((sum, visit) => sum + visit.duration, 0) / visits.length),
    lastVisit: visits[0]?.entryTime || new Date().toISOString()
  };
}

export default function ReportsPage() {
  // Initialize data directly without useEffect
  const [sessionDetails] = useState<SessionDetail[]>(generateMockSessionDetails());
  const [loading] = useState(false);
  const [error] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [reportType, setReportType] = useState("overview");
  const [exportFormat, setExportFormat] = useState("csv");
  const [customerPlate, setCustomerPlate] = useState("");
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);

  // Mock report data
  const reportData = {
    totalRevenue: 45800000,
    totalSessions: 1250,
    averageDuration: 145,
    peakHours: ["08:00", "09:00", "17:00", "18:00", "13:00", "14:00"],
    vehicleTypeDistribution: [
      { type: "خودرو", count: 875, percentage: 70.0 },
      { type: "موتورسیکلت", count: 250, percentage: 20.0 },
      { type: "وانت", count: 87, percentage: 7.0 },
      { type: "اتوبوس", count: 25, percentage: 2.0 },
      { type: "کامیون", count: 13, percentage: 1.0 }
    ],
    paymentMethodDistribution: [
      { method: "نقدی", amount: 18320000, percentage: 40.0 },
      { method: "کارت", amount: 13740000, percentage: 30.0 },
      { method: "POS", amount: 9160000, percentage: 20.0 },
      { method: "آنلاین", amount: 3664000, percentage: 8.0 },
      { method: "کارت به کارت", amount: 916000, percentage: 2.0 }
    ],
    dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      revenue: Math.floor(Math.random() * 3500000) + 800000,
      sessions: Math.floor(Math.random() * 120) + 30
    })),
    hourlyStats: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      revenue: Math.floor(Math.random() * 800000) + 100000,
      sessions: Math.floor(Math.random() * 25) + 5
    })),
    weeklyStats: Array.from({ length: 12 }, (_, i) => ({
      weekStart: new Date(Date.now() - (11 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      revenue: Math.floor(Math.random() * 15000000) + 5000000,
      sessions: Math.floor(Math.random() * 400) + 200
    })),
    monthlyStats: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      revenue: Math.floor(Math.random() * 60000000) + 20000000,
      sessions: Math.floor(Math.random() * 1500) + 800
    })),
    shiftReports: [
      {
        id: "1",
        name: "شیفت صبح",
        operator: "علی رضایی",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 8900000,
        totalSessions: 185,
        completedSessions: 182
      },
      {
        id: "2",
        name: "شیفت عصر",
        operator: "مریم احمدی",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 12300000,
        totalSessions: 265,
        completedSessions: 260
      },
      {
        id: "3",
        name: "شیفت شب",
        operator: "حسن محمدی",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        totalRevenue: 5600000,
        totalSessions: 95,
        completedSessions: 92
      }
    ],
    topCustomers: [
      { plateNumber: "۱۲۳۴۵۶۷۸", visits: 45, totalSpent: 1250000, averageSpent: 27778 },
      { plateNumber: "۸۷۶۵۴۳۲۱", visits: 38, totalSpent: 980000, averageSpent: 25789 },
      { plateNumber: "۱۱۱۲۲۳۳", visits: 32, totalSpent: 850000, averageSpent: 26563 },
      { plateNumber: "۴۴۴۴۴۴۴", visits: 28, totalSpent: 720000, averageSpent: 25714 },
      { plateNumber: "۵۵۵۵۵۵۵", visits: 25, totalSpent: 650000, averageSpent: 26000 }
    ]
  };

  const handleCustomerSearch = () => {
    if (!customerPlate.trim()) return;
    
    try {
      const history = generateCustomerHistory(customerPlate);
      setCustomerHistory(history);
      setShowCustomerDialog(true);
    } catch (err) {
      console.error("Error loading customer history:", err);
    }
  };

  const handleExport = (format: string) => {
    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "csv") {
      content = "تاریخ,درآمد,تعداد جلسات,میانگین مدت زمان\n";
      reportData.dailyRevenue.forEach(day => {
        content += `${formatPersianDateSimple(day.date, "YYYY/MM/DD")},${day.revenue},${day.sessions},${Math.floor(reportData.averageDuration)}\n`;
      });
      filename = `گزارش_درآمد_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.csv`;
      mimeType = "text/csv";
    } else if (format === "json") {
      const fullReportData = {
        ...reportData,
        exportDate: new Date().toISOString(),
        generatedBy: "سیستم مدیریت پارکینگ هوشمند",
        summary: {
          totalDays: reportData.dailyRevenue.length,
          averageDailyRevenue: Math.floor(reportData.totalRevenue / reportData.dailyRevenue.length),
          averageDailySessions: Math.floor(reportData.totalSessions / reportData.dailyRevenue.length)
        }
      };
      content = JSON.stringify(fullReportData, null, 2);
      filename = `گزارش_کامل_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.json`;
      mimeType = "application/json";
    } else if (format === "pdf") {
      // Simulate PDF generation
      content = `گزارش کامل پارکینگ
تاریخ تولید: ${formatPersianDateSimple(new Date())}

خلاصه آمار:
- کل درآمد: ${toPersianNumeralsSimple(reportData.totalRevenue.toLocaleString())} تومان
- کل جلسات: ${toPersianNumeralsSimple(reportData.totalSessions)}
- میانگین مدت زمان: ${formatDuration(reportData.averageDuration)}

توزیع وسایل نقلیه:
${reportData.vehicleTypeDistribution.map(item => `- ${item.type}: ${toPersianNumeralsSimple(item.count)} (${toPersianNumeralsSimple(item.percentage)}%)`).join('\n')}

توزیع روش‌های پرداخت:
${reportData.paymentMethodDistribution.map(item => `- ${item.method}: ${toPersianNumeralsSimple(item.amount.toLocaleString())} تومان (${toPersianNumeralsSimple(item.percentage)}%)`).join('\n')}

مشتریان برتر:
${reportData.topCustomers.map(customer => `- ${customer.plateNumber}: ${toPersianNumeralsSimple(customer.visits)} بازدید، ${toPersianNumeralsSimple(customer.totalSpent.toLocaleString())} تومان`).join('\n')}
`;
      filename = `گزارش_پارکینگ_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.txt`;
      mimeType = "text/plain";
    } else if (format === "excel") {
      // Simulate Excel format (CSV with more detailed structure)
      content = "نوع گزارش,تاریخ,مقدار,توضیحات\n";
      content += `کل درآمد,${formatPersianDateSimple(new Date())},${reportData.totalRevenue},جمع کل درآمد پارکینگ\n`;
      content += `کل جلسات,${formatPersianDateSimple(new Date())},${reportData.totalSessions},تعداد کل جلسات پارکینگ\n`;
      content += `میانگین مدت,${formatPersianDateSimple(new Date())},${reportData.averageDuration},میانگین مدت زمان حضور\n`;
      
      reportData.vehicleTypeDistribution.forEach(item => {
        content += `توزیع وسایل,${formatPersianDateSimple(new Date())},${item.count},${item.type}\n`;
      });
      
      reportData.paymentMethodDistribution.forEach(item => {
        content += `توزیع پرداخت,${formatPersianDateSimple(new Date())},${item.amount},${item.method}\n`;
      });
      
      filename = `گزارش_اکسل_${formatPersianDateSimple(new Date(), "YYYY_MM_DD")}.csv`;
      mimeType = "text/csv";
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { label: "تکمیل شده", variant: "default" as const },
      ACTIVE: { label: "فعال", variant: "secondary" as const },
      CANCELLED: { label: "لغو شده", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.COMPLETED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
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
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleExport(exportFormat)}>
              <Download className="h-4 w-4 ml-2" />
              خروجی
            </Button>
          </div>
        </div>

        {/* Customer Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">جستجوی مشتری:</span>
              </div>
              <Input
                placeholder="شماره پلاک را وارد کنید"
                value={customerPlate}
                onChange={(e) => setCustomerPlate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCustomerSearch}>
                <Search className="h-4 w-4 ml-2" />
                جستجو
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">نمای کلی</SelectItem>
                  <SelectItem value="sessions">جلسات</SelectItem>
                  <SelectItem value="revenue">درآمد</SelectItem>
                  <SelectItem value="customers">مشتریان</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ml-2" />
                اعمال فیلتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل درآمد</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumeralsSimple(reportData.totalRevenue.toLocaleString())} تومان
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(reportData.totalRevenue, reportData.totalRevenue * 0.9)}
                    <span className="text-xs text-green-600">+۱۲٪</span>
                  </div>
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
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(reportData.totalSessions, reportData.totalSessions * 0.95)}
                    <span className="text-xs text-green-600">+۵٪</span>
                  </div>
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
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(reportData.averageDuration, reportData.averageDuration * 1.1)}
                    <span className="text-xs text-red-600">-۱۰٪</span>
                  </div>
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
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(reportData.totalRevenue / reportData.totalSessions, (reportData.totalRevenue / reportData.totalSessions) * 0.98)}
                    <span className="text-xs text-red-600">-۲٪</span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="sessions">جلسات</TabsTrigger>
            <TabsTrigger value="revenue">درآمد</TabsTrigger>
            <TabsTrigger value="customers">مشتریان</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                        <TableHead>وضعیت</TableHead>
                        <TableHead>اپراتور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionDetails.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.plateNumber}</TableCell>
                          <TableCell>{formatPersianDateSimple(session.entryTime, "HH:mm")}</TableCell>
                          <TableCell>
                            {session.exitTime ? formatPersianDateSimple(session.exitTime, "HH:mm") : "-"}
                          </TableCell>
                          <TableCell>{formatDuration(session.duration)}</TableCell>
                          <TableCell>{toPersianNumeralsSimple(session.amount.toLocaleString())} تومان</TableCell>
                          <TableCell>{getStatusBadge(session.status)}</TableCell>
                          <TableCell>{session.operator}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تحلیل درآمد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">درآمد به تفکیک روش پرداخت</h3>
                    <div className="space-y-3">
                      {reportData.paymentMethodDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{item.method}</span>
                          <div className="text-right">
                            <div className="font-semibold">{toPersianNumeralsSimple(item.amount.toLocaleString())} تومان</div>
                            <div className="text-sm text-gray-600">{toPersianNumeralsSimple(item.percentage)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">درآمد به تفکیک وسیله نقلیه</h3>
                    <div className="space-y-3">
                      {reportData.vehicleTypeDistribution.map((item, index) => {
                        const avgAmount = Math.floor(reportData.totalRevenue * item.percentage / 100 / item.count);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{item.type}</div>
                              <div className="text-sm text-gray-600">{toPersianNumeralsSimple(item.count)} دستگاه</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{toPersianNumeralsSimple(avgAmount.toLocaleString())} تومان</div>
                              <div className="text-sm text-gray-600">میانگین</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>مشتریان برتر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{toPersianNumeralsSimple(index + 1)}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{customer.plateNumber}</p>
                          <p className="text-sm text-gray-600">
                            {toPersianNumeralsSimple(customer.visits)} بازدید • میانگین: {toPersianNumeralsSimple(customer.averageSpent.toLocaleString())} تومان
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {toPersianNumeralsSimple(customer.totalSpent.toLocaleString())} تومان
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setCustomerPlate(customer.plateNumber);
                            handleCustomerSearch();
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          جزئیات
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>تحلیل مشتریان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">تحلیل مشتریان</h3>
                  <p className="text-gray-600 mb-4">
                    برای مشاهده سوابق تردد مشتریان، از قسمت جستجوی مشتری در بالای صفحه استفاده کنید.
                  </p>
                  <Button onClick={() => setShowCustomerDialog(true)}>
                    <Eye className="h-4 w-4 ml-2" />
                    مشاهده نمونه مشتری
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Customer History Dialog */}
        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>سوابق تردد مشتری</DialogTitle>
            </DialogHeader>
            {customerHistory ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">پلاک: {customerHistory.plateNumber}</h3>
                        {customerHistory.customerInfo && (
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {customerHistory.customerInfo.name && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {customerHistory.customerInfo.name}
                              </div>
                            )}
                            {customerHistory.customerInfo.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {customerHistory.customerInfo.phone}
                              </div>
                            )}
                            {customerHistory.customerInfo.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {customerHistory.customerInfo.email}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {toPersianNumeralsSimple(customerHistory.totalSpent.toLocaleString())} تومان
                        </div>
                        <div className="text-sm text-gray-600">مجموع پرداخت</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {toPersianNumeralsSimple(customerHistory.totalVisits)}
                        </div>
                        <div className="text-sm text-gray-600">تعداد بازدید</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatDuration(customerHistory.averageDuration)}
                        </div>
                        <div className="text-sm text-gray-600">میانگین مدت</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {toPersianNumeralsSimple(Math.floor(customerHistory.totalSpent / customerHistory.totalVisits).toLocaleString())} تومان
                        </div>
                        <div className="text-sm text-gray-600">میانگین پرداخت</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Visit History */}
                <Card>
                  <CardHeader>
                    <CardTitle>سوابق تردد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>تاریخ ورود</TableHead>
                            <TableHead>تاریخ خروج</TableHead>
                            <TableHead>مدت</TableHead>
                            <TableHead>مبلغ</TableHead>
                            <TableHead>روش پرداخت</TableHead>
                            <TableHead>اپراتور</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerHistory.visits.map((visit, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatPersianDateSimple(visit.entryTime, "YYYY/MM/DD HH:mm")}</TableCell>
                              <TableCell>
                                {visit.exitTime ? formatPersianDateSimple(visit.exitTime, "YYYY/MM/DD HH:mm") : "-"}
                              </TableCell>
                              <TableCell>{formatDuration(visit.duration)}</TableCell>
                              <TableCell>{toPersianNumeralsSimple(visit.amount.toLocaleString())} تومان</TableCell>
                              <TableCell>{visit.paymentMethod}</TableCell>
                              <TableCell>{visit.operator}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>اطلاعات مشتری یافت نشد.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}