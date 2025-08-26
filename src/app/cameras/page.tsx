"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Search, 
  Settings, 
  Power, 
  Wifi, 
  WifiOff,
  Camera,
  DoorOpen,
  Edit,
  Trash2,
  Play,
  Stop,
  RefreshCw,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  Activity,
  Filter
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth-guard";

interface Camera {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT" | "BOTH";
  direction: "IN" | "OUT";
  isActive: boolean;
  ipAddress?: string;
  rtspUrl?: string;
  resolution?: string;
  doorId?: string;
  doorName?: string;
  locationName: string;
  lastSeen?: string;
  status: "ONLINE" | "OFFLINE" | "ERROR" | "MAINTENANCE";
  createdAt: string;
  updatedAt: string;
}

interface CreateCameraDialogProps {
  onCameraCreated: () => void;
  doors: Array<{ id: string; name: string; locationName: string }>;
}

function CreateCameraDialog({ onCameraCreated, doors }: CreateCameraDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    direction: "",
    doorId: "",
    ipAddress: "",
    rtspUrl: "",
    resolution: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData({ 
        name: "", 
        type: "", 
        direction: "", 
        doorId: "", 
        ipAddress: "", 
        rtspUrl: "", 
        resolution: "" 
      });
      setIsOpen(false);
      onCameraCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد دوربین");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          دوربین جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد دوربین جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">نام دوربین</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: دوربین ورودی اصلی"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="doorId">درب</Label>
            <Select
              value={formData.doorId}
              onValueChange={(value) => setFormData({ ...formData, doorId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب درب" />
              </SelectTrigger>
              <SelectContent>
                {doors.map((door) => (
                  <SelectItem key={door.id} value={door.id}>
                    <div>
                      <div>{door.name}</div>
                      <div className="text-xs text-gray-500">
                        {door.locationNames.join("، ")}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="type">نوع</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">ورودی</SelectItem>
                  <SelectItem value="EXIT">خروجی</SelectItem>
                  <SelectItem value="BOTH">دو طرفه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="direction">جهت</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="جهت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">ورود</SelectItem>
                  <SelectItem value="OUT">خروج</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="ipAddress">آدرس IP</Label>
            <Input
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              placeholder="192.168.1.100"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="rtspUrl">RTSP (اختیاری)</Label>
              <Input
                value={formData.rtspUrl}
                onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
                placeholder="rtsp://..."
              />
            </div>
            
            <div>
              <Label htmlFor="resolution">رزولوشن (اختیاری)</Label>
              <Input
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="1920x1080"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !formData.doorId} 
              className="flex-1"
            >
              {loading ? "در حال ایجاد..." : "ایجاد دوربین"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              انصراف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "ONLINE": return "default";
    case "OFFLINE": return "secondary";
    case "ERROR": return "destructive";
    case "MAINTENANCE": return "outline";
    default: return "secondary";
  }
}

function getStatusLabel(status: string) {
  const labels = {
    "ONLINE": "آنلاین",
    "OFFLINE": "آفلاین",
    "ERROR": "خطا",
    "MAINTENANCE": "تعمیرات"
  };
  return labels[status as keyof typeof labels] || status;
}

function getCameraTypeLabel(type: string) {
  const labels = {
    "ENTRY": "ورودی",
    "EXIT": "خروجی",
    "BOTH": "دو طرفه"
  };
  return labels[type as keyof typeof labels] || type;
}

function getDirectionLabel(direction: string) {
  return direction === "IN" ? "ورود" : "خروج";
}

export default function CamerasManagementPage() {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [simulationActive, setSimulationActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Mock doors for camera creation
  const doors = [
    { id: "1", name: "درب ورودی اصلی", locationNames: ["پارکینگ مرکزی", "پارکینگ غرب"] },
    { id: "2", name: "درب خروجی اصلی", locationNames: ["پارکینگ مرکزی"] },
    { id: "3", name: "درب ورودی غرب", locationNames: ["پارکینگ غرب"] },
    { id: "4", name: "درب خروجی شرق", locationNames: ["پارکینگ شرق", "پارکینگ شمال"] },
    { id: "5", name: "درب خدماتی", locationNames: ["پارکینگ مرکزی", "پارکینگ شرق", "پارکینگ جنوب"] }
  ];

  // Generate mock cameras
  const generateMockCameras = (): Camera[] => [
    {
      id: "1",
      name: "دوربین ورودی اصلی",
      type: "ENTRY",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.101",
      rtspUrl: "rtsp://192.168.1.101:554/stream",
      resolution: "1920x1080",
      doorId: "1",
      doorName: "درب ورودی اصلی",
      locationName: "پارکینگ مرکزی",
      lastSeen: new Date().toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "دوربین خروجی اصلی",
      type: "EXIT",
      direction: "OUT",
      isActive: true,
      ipAddress: "192.168.1.102",
      rtspUrl: "rtsp://192.168.1.102:554/stream",
      resolution: "1920x1080",
      doorId: "2",
      doorName: "درب خروجی اصلی",
      locationName: "پارکینگ مرکزی",
      lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "دوربین ورودی غرب",
      type: "ENTRY",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.103",
      rtspUrl: "rtsp://192.168.1.103:554/stream",
      resolution: "1920x1080",
      doorId: "3",
      doorName: "درب ورودی غرب",
      locationName: "پارکینگ غرب",
      lastSeen: new Date().toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "دوربین خروجی شرق",
      type: "EXIT",
      direction: "OUT",
      isActive: false,
      ipAddress: "192.168.1.104",
      rtspUrl: "rtsp://192.168.1.104:554/stream",
      resolution: "1920x1080",
      doorId: "4",
      doorName: "درب خروجی شرق",
      locationName: "پارکینگ شرق",
      lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "OFFLINE",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "دوربین پارکینگ مرکزی",
      type: "BOTH",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.105",
      rtspUrl: "rtsp://192.168.1.105:554/stream",
      resolution: "1920x1080",
      doorId: "1",
      doorName: "درب ورودی اصلی",
      locationName: "پارکینگ مرکزی",
      lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "6",
      name: "دوربین خدماتی",
      type: "BOTH",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.106",
      rtspUrl: "rtsp://192.168.1.106:554/stream",
      resolution: "1920x1080",
      doorId: "5",
      doorName: "درب خدماتی",
      locationName: "پارکینگ مرکزی",
      lastSeen: new Date().toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setCameras(generateMockCameras());
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleCamera = async (cameraId: string, isActive: boolean) => {
    try {
      setCameras(prev => prev.map(camera => 
        camera.id === cameraId 
          ? { 
              ...camera, 
              isActive: !isActive, 
              status: !isActive ? "OFFLINE" : "ONLINE" 
            }
          : camera
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت دوربین");
    }
  };

  const handleToggleSimulation = () => {
    setSimulationActive(!simulationActive);
    
    if (!simulationActive) {
      // Start simulation - update camera statuses periodically
      const interval = setInterval(() => {
        if (!simulationActive) {
          clearInterval(interval);
          return;
        }
        
        setCameras(prev => prev.map(camera => ({
          ...camera,
          lastSeen: new Date().toISOString(),
          status: Math.random() > 0.1 ? "ONLINE" : "OFFLINE"
        })));
      }, 5000);
    }
  };

  // Enhanced filtering and search
  const filteredCameras = cameras.filter(camera => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        camera.name.toLowerCase().includes(term) ||
        camera.ipAddress?.toLowerCase().includes(term) ||
        camera.doorName?.toLowerCase().includes(term) ||
        camera.locationName.toLowerCase().includes(term);
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== "ALL" && camera.type !== filterType) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== "ALL" && camera.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">مدیریت دوربین‌ها</h1>
              <p className="text-gray-600 mt-1">
                {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={simulationActive ? "default" : "outline"}
                onClick={handleToggleSimulation}
              >
                {simulationActive ? <Stop className="h-4 w-4 ml-2" /> : <Play className="h-4 w-4 ml-2" />}
                {simulationActive ? "توقف شبیه‌سازی" : "شروع شبیه‌سازی"}
              </Button>
              <CreateCameraDialog onCameraCreated={() => {}} doors={doors} />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">کل دوربین‌ها</p>
                    <p className="text-2xl font-bold">{toPersianNumerals(cameras.length)}</p>
                  </div>
                  <Camera className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">آنلاین</p>
                    <p className="text-2xl font-bold text-green-600">
                      {toPersianNumerals(cameras.filter(c => c.status === "ONLINE").length)}
                    </p>
                  </div>
                  <Wifi className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">آفلاین</p>
                    <p className="text-2xl font-bold text-red-600">
                      {toPersianNumerals(cameras.filter(c => c.status === "OFFLINE").length)}
                    </p>
                  </div>
                  <WifiOff className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">دوربین‌های ورودی</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {toPersianNumerals(cameras.filter(c => c.type === "ENTRY").length)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                جستجو و فیلتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس نام، IP، درب یا پارکینگ"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع دوربین" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه انواع</SelectItem>
                    <SelectItem value="ENTRY">ورودی</SelectItem>
                    <SelectItem value="EXIT">خروجی</SelectItem>
                    <SelectItem value="BOTH">دو طرفه</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="ONLINE">آنلاین</SelectItem>
                    <SelectItem value="OFFLINE">آفلاین</SelectItem>
                    <SelectItem value="ERROR">خطا</SelectItem>
                    <SelectItem value="MAINTENANCE">تعمیرات</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("ALL");
                    setFilterStatus("ALL");
                  }}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  بازنشانی
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cameras Table */}
          <Card>
            <CardHeader>
              <CardTitle>لیست دوربین‌ها</CardTitle>
              <p className="text-sm text-gray-600">
                نمایش {toPersianNumerals(filteredCameras.length)} دوربین از {toPersianNumerals(cameras.length)} دوربین
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام دوربین</TableHead>
                      <TableHead>درب</TableHead>
                      <TableHead>پارکینگ</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>آدرس IP</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCameras.map((camera) => (
                      <TableRow key={camera.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{camera.name}</div>
                              <div className="text-xs text-gray-500">
                                {getDirectionLabel(camera.direction)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DoorOpen className="h-3 w-3" />
                            {camera.doorName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {camera.locationName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCameraTypeLabel(camera.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {camera.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(camera.status)}>
                            {getStatusLabel(camera.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleCamera(camera.id, camera.isActive)}
                            >
                              {camera.isActive ? (
                                <Power className="h-3 w-3" />
                              ) : (
                                <WifiOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {filteredCameras.length === 0 && (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">دوربینی با فیلترهای انتخاب شده یافت نشد</p>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}