"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Camera, 
  CameraOff, 
  Car, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Settings,
  BarChart3,
  Users,
  LogOut,
  Volume2,
  VolumeX,
  DollarSign,
  X,
  Smartphone
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { TariffCalculator } from "@/lib/tariff-calculator";
import { PaymentProcessor } from "@/components/payment-processor";
import { PaymentMethod } from "@/lib/payment-service";

// Mock data for demonstration
const mockTariffs = [
  {
    id: "1",
    name: "تعرفه عادی خودرو",
    vehicleType: "CAR",
    entranceFee: 5000,
    freeMinutes: 15,
    hourlyRate: 3000,
    dailyRate: 25000,
    nightlyRate: 20000,
    dailyCap: 80000,
    nightlyCap: 50000,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  },
  {
    id: "2",
    name: "تعرفه موتورسیکلت",
    vehicleType: "MOTORCYCLE",
    entranceFee: 2000,
    freeMinutes: 20,
    hourlyRate: 1500,
    dailyRate: 12000,
    nightlyRate: 10000,
    dailyCap: 40000,
    nightlyCap: 25000,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  }
];

const mockSessions = [
  {
    id: "1",
    plateNumber: "۱۲۳۴۵۶۷۸",
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    vehicleType: "CAR",
    status: "ACTIVE",
    duration: 120,
    amount: 15000
  },
  {
    id: "2",
    plateNumber: "۸۷۶۵۴۳۲۱",
    entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    vehicleType: "CAR",
    status: "ACTIVE",
    duration: 60,
    amount: 8000
  },
  {
    id: "3",
    plateNumber: "۱۱۱۲۲۳۳",
    entryTime: new Date(Date.now() - 45 * 60 * 1000),
    vehicleType: "MOTORCYCLE",
    status: "ACTIVE",
    duration: 45,
    amount: 5000
  }
];

const mockEvents = [
  {
    id: "1",
    type: "ENTRY",
    plateNumber: "۱۲۳۴۵۶۷۸",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    camera: "ورودی",
    status: "SUCCESS"
  },
  {
    id: "2",
    type: "EXIT",
    plateNumber: "۵۵۵۵۵۵۵",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    camera: "خروجی",
    status: "SUCCESS"
  },
  {
    id: "3",
    type: "PAYMENT",
    plateNumber: "۹۸۷۶۵۴۳",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    amount: 25000,
    status: "SUCCESS"
  }
];

interface CameraViewProps {
  title: string;
  type: "entry" | "exit";
  isActive: boolean;
  onToggle: () => void;
}

function CameraView({ title, type, isActive, onToggle }: CameraViewProps) {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [lastDetection, setLastDetection] = useState<string | null>(null);

  const simulateDetection = () => {
    const plates = ["۱۲۳۴۵۶۷۸", "۸۷۶۵۴۳۲۱", "۱۱۱۲۲۳۳", "۴۴۴۴۴۴۴", "۵۵۵۵۵۵۵"];
    const randomPlate = plates[Math.floor(Math.random() * plates.length)];
    setLastDetection(randomPlate);
    
    // Clear after 3 seconds
    setTimeout(() => setLastDetection(null), 3000);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isDebugMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDebugMode(!isDebugMode)}
            >
              دیباگ
            </Button>
            <Button
              variant={isActive ? "default" : "destructive"}
              size="sm"
              onClick={onToggle}
            >
              {isActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {isActive ? (
            <>
              {/* Simulated camera feed */}
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">دوربین فعال</p>
                  <p className="text-sm text-gray-500 mt-1">FPS: 30</p>
                </div>
              </div>
              
              {/* Debug overlay */}
              {isDebugMode && (
                <div className="absolute inset-0 bg-black bg-opacity-50 text-white p-2 text-xs font-mono">
                  <div>کد دوربین: {type === "entry" ? "CAM001" : "CAM002"}</div>
                  <div>وضعیت: متصل</div>
                  <div>تشخیص پلاک: فعال</div>
                  <div>دقت: ۹۵٪</div>
                  <div>آخرین فریم: {new Date().toLocaleTimeString("fa-IR")}</div>
                </div>
              )}
              
              {/* Detection overlay */}
              {lastDetection && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg animate-pulse">
                    پلاک شناسایی شد: {lastDetection}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-red-900 flex items-center justify-center">
              <div className="text-center">
                <CameraOff className="h-16 w-16 mx-auto mb-2 text-red-300" />
                <p className="text-red-300">دوربین غیرفعال</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-2">
          <Button 
            onClick={simulateDetection} 
            disabled={!isActive}
            className="w-full"
            variant="outline"
          >
            شبیه‌سازی تشخیص پلاک
          </Button>
          
          {lastDetection && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                پلاک {lastDetection} با موفقیت شناسایی شد
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ParkingDashboard() {
  const [entryCameraActive, setEntryCameraActive] = useState(true);
  const [exitCameraActive, setExitCameraActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState({
    id: "1",
    name: "شیفت صبح",
    operator: "علی رضایی",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    revenue: 125000
  });

  const stats = {
    totalCapacity: 100,
    occupiedSpaces: 67,
    todaySessions: 45,
    todayRevenue: 1250000,
    activeSessions: mockSessions.length
  };

  // Function to calculate real-time cost for a session
  const calculateRealTimeCost = (session: any) => {
    const tariff = mockTariffs.find(t => t.vehicleType === session.vehicleType);
    if (!tariff) return session.amount;

    const now = new Date();
    const calculation = TariffCalculator.calculate({
      entryTime: session.entryTime,
      exitTime: now,
      vehicleType: session.vehicleType,
      tariff,
      isHoliday: false, // In real app, this would be calculated
      isWeekend: false // In real app, this would be calculated
    });

    return calculation.totalAmount;
  };

  // Function to get duration in minutes
  const getDuration = (entryTime: Date) => {
    const now = new Date();
    const durationMs = now.getTime() - entryTime.getTime();
    return Math.floor(durationMs / (1000 * 60));
  };

  // Function to handle payment
  const handlePayment = (session: any) => {
    setSelectedSession(session);
    setIsPaymentDialogOpen(true);
  };

  // Function to handle payment completion
  const handlePaymentComplete = (payment: any) => {
    // Update the session in the mock data
    const sessionIndex = mockSessions.findIndex(s => s.id === selectedSession.id);
    if (sessionIndex !== -1) {
      mockSessions[sessionIndex] = {
        ...mockSessions[sessionIndex],
        paidAmount: (mockSessions[sessionIndex].paidAmount || 0) + payment.amount,
        status: payment.amount >= (mockSessions[sessionIndex].totalAmount - (mockSessions[sessionIndex].paidAmount || 0)) ? 'COMPLETED' : 'ACTIVE'
      };
    }
    
    setIsPaymentDialogOpen(false);
    setSelectedSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">سیستم مدیریت پارکینگ هوشمند</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{currentShift.name}</p>
              <p className="text-sm text-gray-600">اپراتور: {currentShift.operator}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 ml-2" />
              تنظیمات
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/tariffs">
                <CreditCard className="h-4 w-4 ml-2" />
                تعرفه‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/pos">
                <Smartphone className="h-4 w-4 ml-2" />
                دستگاه‌های POS
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/shifts">
                <Clock className="h-4 w-4 ml-2" />
                شیفت‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/users">
                <Users className="h-4 w-4 ml-2" />
                کاربران
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/reports">
                <BarChart3 className="h-4 w-4 ml-2" />
                گزارش‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/hardware">
                <Settings className="h-4 w-4 ml-2" />
                سخت‌افزار
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ظرفیت کل</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.totalCapacity)}</p>
                </div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فضای اشغالی</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {toPersianNumerals(stats.occupiedSpaces)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">
                    {Math.round((stats.occupiedSpaces / stats.totalCapacity) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تردد امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todaySessions)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درآمد امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todayRevenue.toLocaleString())}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فعال‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.activeSessions)}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Views */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CameraView
                title="دوربین ورودی"
                type="entry"
                isActive={entryCameraActive}
                onToggle={() => setEntryCameraActive(!entryCameraActive)}
              />
              <CameraView
                title="دوربین خروجی"
                type="exit"
                isActive={exitCameraActive}
                onToggle={() => setExitCameraActive(!exitCameraActive)}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>وسایل نقلیه فعال</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mockSessions.map((session) => {
                      const realTimeCost = calculateRealTimeCost(session);
                      const currentDuration = getDuration(session.entryTime);
                      const remainingAmount = realTimeCost - (session.paidAmount || 0);
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{session.plateNumber}</p>
                            <p className="text-sm text-gray-600">
                              {formatPersianDate(session.entryTime, "HH:mm")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{currentDuration} دقیقه</Badge>
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              {toPersianNumerals(realTimeCost.toLocaleString())} تومان
                            </p>
                            {session.paidAmount > 0 && (
                              <p className="text-xs text-gray-500">
                                پرداخت شده: {toPersianNumerals(session.paidAmount.toLocaleString())} تومان
                              </p>
                            )}
                            {remainingAmount > 0 && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => handlePayment(session)}
                              >
                                <DollarSign className="h-3 w-3 ml-1" />
                                پرداخت
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>رویدادهای اخیر</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mockEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          event.status === "SUCCESS" ? "bg-green-500" : "bg-red-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {event.type === "ENTRY" && "ورود"}
                            {event.type === "EXIT" && "خروج"}
                            {event.type === "PAYMENT" && "پرداخت"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {event.plateNumber} • {event.camera} • {formatPersianDate(event.timestamp, "HH:mm")}
                          </p>
                        </div>
                        {event.amount && (
                          <p className="text-sm font-semibold text-green-600">
                            {toPersianNumerals(event.amount.toLocaleString())} تومان
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              پرداخت پارکینگ
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <PaymentProcessor
              session={{
                ...selectedSession,
                paidAmount: selectedSession.paidAmount || 0,
                totalAmount: calculateRealTimeCost(selectedSession)
              }}
              onPaymentComplete={handlePaymentComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}