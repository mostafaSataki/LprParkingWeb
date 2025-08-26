"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Volume2,
  VolumeX,
  X,
  ParkingCircle,
  Building,
  MapPin,
  CreditCard as PaymentIcon,
  User,
  Activity,
  Wifi,
  WifiOff,
  Shield
} from "lucide-react";
import { PaymentProcessor } from "@/components/payment-processor";
import { PaymentMethod } from "@/lib/payment-service";
import { NavigationMenuCustom } from "@/components/navigation-menu-custom";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth-guard";

// Mock data hook
const useMockData = () => {
  return useMemo(() => ({
    parkingLots: [
      {
        id: "1",
        name: "طبقه همکف",
        totalCapacity: 50,
        occupiedSpaces: 32,
        floorNumber: 0,
        section: "A"
      },
      {
        id: "2", 
        name: "طبقه اول",
        totalCapacity: 40,
        occupiedSpaces: 28,
        floorNumber: 1,
        section: "B"
      },
      {
        id: "3",
        name: "طبقه دوم", 
        totalCapacity: 35,
        occupiedSpaces: 15,
        floorNumber: 2,
        section: "C"
      }
    ],
    cameras: [
      {
        id: "1",
        name: "دوربین ورودی اصلی",
        type: "ENTRY",
        direction: "IN",
        isActive: true,
        location: "ورودی اصلی"
      },
      {
        id: "2",
        name: "دوربین خروجی اصلی", 
        type: "EXIT",
        direction: "OUT",
        isActive: true,
        location: "خروجی اصلی"
      }
    ],
    sessions: [
      {
        id: "1",
        plateNumber: "۱۲۳۴۵۶۷۸",
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        vehicleType: "CAR",
        status: "ACTIVE",
        duration: 120,
        amount: 15000,
        paidAmount: 0,
        lotName: "طبقه همکف",
        entryImage: "/api/placeholder/300/200",
        croppedPlateImage: "/api/placeholder/150/80"
      },
      {
        id: "2",
        plateNumber: "۸۷۶۵۴۳۲۱",
        entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        vehicleType: "CAR",
        status: "ACTIVE",
        duration: 60,
        amount: 8000,
        paidAmount: 0,
        lotName: "طبقه اول",
        entryImage: "/api/placeholder/300/200",
        croppedPlateImage: "/api/placeholder/150/80"
      }
    ]
  }), []);
};

interface CameraFrameProps {
  title: string;
  type: "entry" | "exit";
  isActive: boolean;
  onToggle: () => void;
  onDetection?: (plateData: any) => void;
}

// Optimized Camera Frame component
const CameraFrame = React.memo(({ title, type, isActive, onToggle, onDetection }: CameraFrameProps) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [lastDetection, setLastDetection] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Optimized Persian numerals converter
  const toPersianNumerals = useMemo(() => {
    return (num: number | string): string => {
      const str = num.toString();
      const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
    };
  }, []);

  const simulateDetection = useCallback(async () => {
    if (!isActive) return;
    
    setIsDetecting(true);
    const plates = [
      { number: "۱۲۳۴۵۶۷۸", confidence: 0.95, name: "پراید", parkingSpot: "A-15" },
      { number: "۸۷۶۵۴۳۲۱", confidence: 0.92, name: "پژو", parkingSpot: "B-08" },
      { number: "۱۱۱۲۲۳۳", confidence: 0.88, name: "تیبا", parkingSpot: "C-12" }
    ];
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const randomPlate = plates[Math.floor(Math.random() * plates.length)];
    const detectionData = {
      ...randomPlate,
      timestamp: new Date(),
      image: "/api/placeholder/300/200",
      croppedImage: "/api/placeholder/150/80"
    };
    
    setLastDetection(detectionData);
    setIsDetecting(false);
    
    if (onDetection) {
      onDetection(detectionData);
    }
    
    setTimeout(() => setLastDetection(null), 5000);
  }, [isActive, onDetection]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
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
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">دوربین فعال</p>
                  <p className="text-sm text-gray-500 mt-1">FPS: 30</p>
                </div>
              </div>
              
              {isDebugMode && (
                <div className="absolute inset-0 bg-black bg-opacity-50 text-white p-2 text-xs font-mono">
                  <div>کد دوربین: {type === "entry" ? "CAM001" : "CAM002"}</div>
                  <div>وضعیت: متصل</div>
                  <div>تشخیص پلاک: فعال</div>
                  <div>دقت: ۹۵٪</div>
                  <div>آخرین فریم: {new Date().toLocaleTimeString("fa-IR")}</div>
                </div>
              )}
              
              {isDetecting && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p>در حال تشخیص پلاک...</p>
                  </div>
                </div>
              )}
              
              {lastDetection && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="mb-4 p-2 bg-white rounded-lg">
                    <img 
                      src={lastDetection.croppedImage} 
                      alt="پلاک شناسایی شده"
                      className="w-32 h-16 object-cover rounded"
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 text-center max-w-sm w-full">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">پلاک:</span>
                        <p className="text-xl font-bold">{lastDetection.number}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">نام خودرو:</span>
                        <p className="font-semibold">{lastDetection.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">محل پارک:</span>
                        <p className="font-semibold text-blue-600">{lastDetection.parkingSpot}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">دقت تشخیص:</span>
                        <p className="font-semibold text-green-600">
                          {toPersianNumerals(Math.round(lastDetection.confidence * 100))}%
                        </p>
                      </div>
                    </div>
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
            disabled={!isActive || isDetecting}
            className="w-full"
            variant="outline"
          >
            {isDetecting ? "در حال پردازش..." : "شبیه‌سازی تشخیص پلاک"}
          </Button>
          
          {lastDetection && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                پلاک {lastDetection.number} با موفقیت شناسایی شد
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CameraFrame.displayName = 'CameraFrame';

// Optimized Parking Lot Card component
interface ParkingLotCardProps {
  lot: any;
}

const ParkingLotCard = React.memo(({ lot }: ParkingLotCardProps) => {
  // Optimized Persian numerals converter
  const toPersianNumerals = useMemo(() => {
    return (num: number | string): string => {
      const str = num.toString();
      const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
    };
  }, []);

  const occupancyRate = (lot.occupiedSpaces / lot.totalCapacity) * 100;
  const availableSpaces = lot.totalCapacity - lot.occupiedSpaces;
  
  let statusColor = "text-green-600";
  if (occupancyRate > 80) statusColor = "text-red-600";
  else if (occupancyRate > 60) statusColor = "text-orange-600";
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">{lot.name}</h3>
          </div>
          <Badge variant={occupancyRate > 80 ? "destructive" : occupancyRate > 60 ? "default" : "secondary"}>
            طبقه {lot.floorNumber}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ظرفیت کل:</span>
            <span className="font-semibold">{toPersianNumerals(lot.totalCapacity)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">اشغال شده:</span>
            <span className="font-semibold">{toPersianNumerals(lot.occupiedSpaces)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">خالی:</span>
            <span className={`font-semibold ${statusColor}`}>
              {toPersianNumerals(availableSpaces)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                occupancyRate > 80 ? "bg-red-500" : 
                occupancyRate > 60 ? "bg-orange-500" : "bg-green-500"
              }`}
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            {toPersianNumerals(Math.round(occupancyRate))}% اشغال
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ParkingLotCard.displayName = 'ParkingLotCard';

// Main Dashboard Component
function EnhancedParkingDashboard() {
  const { user, currentLocation, currentGate, logout } = useAuth();
  const [entryCameraActive, setEntryCameraActive] = useState(true);
  const [exitCameraActive, setExitCameraActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { parkingLots, cameras, sessions } = useMockData();

  // Optimized Persian date formatter
  const formatPersianDate = useMemo(() => {
    return (date: Date | string, format: string = "YYYY/MM/DD HH:mm"): string => {
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
    };
  }, []);

  // Optimized Persian numerals converter
  const toPersianNumerals = useMemo(() => {
    return (num: number | string): string => {
      const str = num.toString();
      const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
    };
  }, []);

  // Memoized stats calculation
  const stats = useMemo(() => ({
    totalCapacity: parkingLots.reduce((sum, lot) => sum + lot.totalCapacity, 0),
    occupiedSpaces: parkingLots.reduce((sum, lot) => sum + lot.occupiedSpaces, 0),
    todaySessions: 45,
    todayRevenue: 1250000,
    activeSessions: sessions.length
  }), [parkingLots, sessions]);

  // Memoized handlers
  const handlePlateDetection = useCallback((plateData: any) => {
    console.log("Plate detected:", plateData);
  }, []);

  const handlePayment = useCallback((session: any) => {
    setSelectedSession(session);
    setIsPaymentDialogOpen(true);
  }, []);

  const handlePaymentComplete = useCallback((payment: any) => {
    setIsPaymentDialogOpen(false);
    setSelectedSession(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold">سیستم مدیریت پارکینگ هوشمند</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 text-sm">
                {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{currentLocation?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <Badge variant="outline">{user?.role}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>{currentGate?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavigationMenuCustom 
              soundEnabled={soundEnabled}
              onSoundToggle={() => setSoundEnabled(!soundEnabled)}
            />
            <Button onClick={logout} variant="outline" size="sm">
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ظرفیت کل</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.totalCapacity)}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اشغال شده</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.occupiedSpaces)}</p>
                </div>
                <Car className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">جلسات امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todaySessions)}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درآمد امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todayRevenue)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera Feeds */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CameraFrame
                title="دوربین ورودی"
                type="entry"
                isActive={entryCameraActive}
                onToggle={() => setEntryCameraActive(!entryCameraActive)}
                onDetection={handlePlateDetection}
              />
              
              <CameraFrame
                title="دوربین خروجی"
                type="exit"
                isActive={exitCameraActive}
                onToggle={() => setExitCameraActive(!exitCameraActive)}
                onDetection={handlePlateDetection}
              />
            </div>
            
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  جلسات فعال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{session.plateNumber}</p>
                          <p className="text-sm text-gray-600">{session.lotName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{toPersianNumerals(session.amount)} تومان</p>
                        <p className="text-sm text-gray-600">{toPersianNumerals(session.duration)} دقیقه</p>
                      </div>
                      <Button
                        onClick={() => handlePayment(session)}
                        size="sm"
                      >
                        پرداخت
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Parking Lots Status */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ParkingCircle className="h-5 w-5" />
                  وضعیت پارکینگ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parkingLots.map((lot) => (
                  <ParkingLotCard key={lot.id} lot={lot} />
                ))}
              </CardContent>
            </Card>
            
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  وضعیت سیستم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">دوربین ورودی</span>
                  <Badge variant={entryCameraActive ? "default" : "destructive"}>
                    {entryCameraActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">دوربین خروجی</span>
                  <Badge variant={exitCameraActive ? "default" : "destructive"}>
                    {exitCameraActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">صدا</span>
                  <Badge variant={soundEnabled ? "default" : "secondary"}>
                    {soundEnabled ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">شبکه</span>
                  <Badge variant="default">
                    <Wifi className="h-3 w-3 ml-1" />
                    متصل
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>پرداخت پارکینگ</DialogTitle>
            </DialogHeader>
            {selectedSession && (
              <PaymentProcessor
                session={selectedSession}
                onPaymentComplete={handlePaymentComplete}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard requiredRole="OPERATOR">
      <EnhancedParkingDashboard />
    </AuthGuard>
  );
}