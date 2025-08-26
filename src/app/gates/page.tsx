"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Settings, 
  Power, 
  Wifi, 
  WifiOff,
  Camera,
  Gate,
  Edit,
  Trash2,
  Play,
  Stop,
  RefreshCw,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth-guard";

interface Gate {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT";
  direction: "IN" | "OUT";
  isActive: boolean;
  ipAddress?: string;
  port?: number;
  locationId: string;
  locationName: string;
  cameras: Camera[];
  lastSeen?: string;
  status: "ONLINE" | "OFFLINE" | "ERROR" | "MAINTENANCE";
  createdAt: string;
  updatedAt: string;
}

interface Camera {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT";
  isActive: boolean;
  ipAddress?: string;
  rtspUrl?: string;
  resolution?: string;
  fps?: number;
  lastSeen?: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
}

interface CreateGateDialogProps {
  onGateCreated: () => void;
  locations: Array<{ id: string; name: string }>;
}

function CreateGateDialog({ onGateCreated, locations }: CreateGateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    locationId: "",
    ipAddress: "",
    port: ""
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
      
      setFormData({ name: "", type: "", locationId: "", ipAddress: "", port: "" });
      setIsOpen(false);
      onGateCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد درب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          درب جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد درب جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">نام درب</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: درب ورودی اصلی"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">نوع درب</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRY">ورودی</SelectItem>
                <SelectItem value="EXIT">خروجی</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="locationId">پارکینگ</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => setFormData({ ...formData, locationId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب پارکینگ" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="ipAddress">آدرس IP (اختیاری)</Label>
            <Input
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              placeholder="192.168.1.100"
            />
          </div>
          
          <div>
            <Label htmlFor="port">پورت (اختیاری)</Label>
            <Input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              placeholder="8080"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "در حال ایجاد..." : "ایجاد درب"}
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

function getGateTypeLabel(type: string) {
  return type === "ENTRY" ? "ورودی" : "خروجی";
}

export default function GatesManagementPage() {
  const { user } = useAuth();
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [simulationActive, setSimulationActive] = useState(false);

  // Mock locations
  const locations = [
    { id: "1", name: "پارکینگ مرکزی" },
    { id: "2", name: "پارکینگ غرب" },
    { id: "3", name: "پارکینگ شرق" }
  ];

  // Generate mock gates
  const generateMockGates = (): Gate[] => [
    {
      id: "1",
      name: "درب ورودی اصلی",
      type: "ENTRY",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.201",
      port: 9000,
      locationId: "1",
      locationName: "پارکینگ مرکزی",
      cameras: [
        { 
          id: "1", 
          name: "دوربین ورودی اصلی", 
          type: "ENTRY", 
          isActive: true, 
          ipAddress: "192.168.1.101",
          rtspUrl: "rtsp://192.168.1.101:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "ONLINE"
        }
      ],
      lastSeen: new Date().toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "درب خروجی اصلی",
      type: "EXIT",
      direction: "OUT",
      isActive: true,
      ipAddress: "192.168.1.202",
      port: 9000,
      locationId: "1",
      locationName: "پارکینگ مرکزی",
      cameras: [
        { 
          id: "2", 
          name: "دوربین خروجی اصلی", 
          type: "EXIT", 
          isActive: true, 
          ipAddress: "192.168.1.102",
          rtspUrl: "rtsp://192.168.1.102:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "ONLINE"
        }
      ],
      lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "درب ورودی غرب",
      type: "ENTRY",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.203",
      port: 9000,
      locationId: "2",
      locationName: "پارکینگ غرب",
      cameras: [
        { 
          id: "3", 
          name: "دوربین ورودی غرب", 
          type: "ENTRY", 
          isActive: true, 
          ipAddress: "192.168.1.103",
          rtspUrl: "rtsp://192.168.1.103:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "ONLINE"
        }
      ],
      lastSeen: new Date().toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "درب خروجی غرب",
      type: "EXIT",
      direction: "OUT",
      isActive: false,
      ipAddress: "192.168.1.204",
      port: 9000,
      locationId: "2",
      locationName: "پارکینگ غرب",
      cameras: [
        { 
          id: "4", 
          name: "دوربین خروجی غرب", 
          type: "EXIT", 
          isActive: false, 
          ipAddress: "192.168.1.104",
          rtspUrl: "rtsp://192.168.1.104:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "OFFLINE"
        }
      ],
      lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "OFFLINE",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "درب ورودی شرق",
      type: "ENTRY",
      direction: "IN",
      isActive: true,
      ipAddress: "192.168.1.205",
      port: 9000,
      locationId: "3",
      locationName: "پارکینگ شرق",
      cameras: [
        { 
          id: "5", 
          name: "دوربین ورودی شرق", 
          type: "ENTRY", 
          isActive: true, 
          ipAddress: "192.168.1.105",
          rtspUrl: "rtsp://192.168.1.105:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "ONLINE"
        }
      ],
      lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      status: "ONLINE",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "6",
      name: "درب خروجی شرق",
      type: "EXIT",
      direction: "OUT",
      isActive: true,
      ipAddress: "192.168.1.206",
      port: 9000,
      locationId: "3",
      locationName: "پارکینگ شرق",
      cameras: [
        { 
          id: "6", 
          name: "دوربین خروجی شرق", 
          type: "EXIT", 
          isActive: true, 
          ipAddress: "192.168.1.106",
          rtspUrl: "rtsp://192.168.1.106:554/stream",
          resolution: "1920x1080",
          fps: 30,
          status: "ERROR"
        }
      ],
      lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: "ERROR",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setGates(generateMockGates());
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleGate = async (gateId: string, isActive: boolean) => {
    try {
      setGates(prev => prev.map(gate => 
        gate.id === gateId 
          ? { ...gate, isActive: !isActive, status: !isActive ? "OFFLINE" : "ONLINE" }
          : gate
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت درب");
    }
  };

  const handleToggleCamera = async (gateId: string, cameraId: string, isActive: boolean) => {
    try {
      setGates(prev => prev.map(gate => {
        if (gate.id === gateId) {
          return {
            ...gate,
            cameras: gate.cameras.map(camera =>
              camera.id === cameraId 
                ? { ...camera, isActive: !isActive, status: !isActive ? "OFFLINE" : "ONLINE" }
                : camera
            )
          };
        }
        return gate;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت دوربین");
    }
  };

  const handleToggleSimulation = () => {
    setSimulationActive(!simulationActive);
    
    if (!simulationActive) {
      const interval = setInterval(() => {
        if (!simulationActive) {
          clearInterval(interval);
          return;
        }
        
        setGates(prev => prev.map(gate => ({
          ...gate,
          lastSeen: new Date().toISOString(),
          status: Math.random() > 0.1 ? "ONLINE" : "OFFLINE",
          cameras: gate.cameras.map(camera => ({
            ...camera,
            status: Math.random() > 0.1 ? "ONLINE" : "OFFLINE"
          }))
        })));
      }, 5000);
    }
  };

  const filteredGates = gates.filter(gate => {
    // Filter gates based on user permissions
    if (user?.role === "ADMIN") return true;
    if (user?.role === "SUPERVISOR") return true;
    return user?.assignedGates.includes(gate.id);
  });

  const stats = useMemo(() => ({
    totalGates: gates.length,
    activeGates: gates.filter(g => g.isActive).length,
    onlineGates: gates.filter(g => g.status === "ONLINE").length,
    totalCameras: gates.reduce((sum, gate) => sum + gate.cameras.length, 0),
    activeCameras: gates.reduce((sum, gate) => sum + gate.cameras.filter(c => c.isActive).length, 0)
  }), [gates]);

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
            <h1 className="text-3xl font-bold">مدیریت درب‌ها و دوربین‌ها</h1>
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
            {user?.role === "ADMIN" && (
              <CreateGateDialog onGateCreated={() => {}} locations={locations} />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل درب‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.totalGates)}</p>
                </div>
                <Gate className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درب‌های فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(stats.activeGates)}
                  </p>
                </div>
                <Power className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درب‌های آنلاین</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {toPersianNumerals(stats.onlineGates)}
                  </p>
                </div>
                <Wifi className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل دوربین‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.totalCameras)}</p>
                </div>
                <Camera className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">دوربین‌های فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(stats.activeCameras)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gate className="h-5 w-5" />
              لیست درب‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام درب</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>پارکینگ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>دوربین‌ها</TableHead>
                    <TableHead>آخرین فعالیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGates.map((gate) => (
                    <TableRow key={gate.id}>
                      <TableCell className="font-medium">{gate.name}</TableCell>
                      <TableCell>
                        <Badge variant={gate.type === "ENTRY" ? "default" : "secondary"}>
                          {getGateTypeLabel(gate.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {gate.locationName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(gate.status)}>
                            {getStatusLabel(gate.status)}
                          </Badge>
                          {gate.status === "ONLINE" && <Wifi className="h-3 w-3 text-green-500" />}
                          {gate.status === "OFFLINE" && <WifiOff className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          <span>{toPersianNumerals(gate.cameras.length)}</span>
                          <span className="text-xs text-gray-500">
                            ({toPersianNumerals(gate.cameras.filter(c => c.isActive).length)} فعال)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {gate.lastSeen ? formatPersianDate(gate.lastSeen, "HH:mm") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={gate.isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleGate(gate.id, gate.isActive)}
                          >
                            <Power className="h-3 w-3" />
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
            </div>
          </CardContent>
        </Card>

        {/* Gate Details */}
        <Tabs defaultValue="cameras" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cameras">دوربین‌ها</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cameras">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGates.map((gate) => (
                <Card key={gate.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gate className="h-5 w-5" />
                      {gate.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(gate.status)}>
                        {getStatusLabel(gate.status)}
                      </Badge>
                      <Badge variant="outline">
                        {gate.locationName}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gate.cameras.map((camera) => (
                      <div key={camera.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-sm">{camera.name}</p>
                            <p className="text-xs text-gray-500">{camera.resolution}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(camera.status)} className="text-xs">
                            {getStatusLabel(camera.status)}
                          </Badge>
                          <Button
                            variant={camera.isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleCamera(gate.id, camera.id, camera.isActive)}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات پیشرفته درب‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    این بخش در حال توسعه است. به زودی امکان تنظیمات پیشرفته برای درب‌ها و دوربین‌ها اضافه خواهد شد.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}