"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Printer,
  Monitor,
  Car,
  AlertTriangle,
  CheckCircle,
  Play,
  Stop,
  RefreshCw,
  Activity
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface HardwareDevice {
  id: string;
  name: string;
  type: HardwareType;
  ipAddress?: string;
  port?: number;
  isActive: boolean;
  lastSeen?: string;
  status: DeviceStatus;
  config?: string;
  createdAt: string;
  updatedAt: string;
}

enum HardwareType {
  CAMERA_ENTRY = "CAMERA_ENTRY",
  CAMERA_EXIT = "CAMERA_EXIT",
  BARRIER_ENTRY = "BARRIER_ENTRY",
  BARRIER_EXIT = "BARRIER_EXIT",
  PRINTER = "PRINTER",
  LED_DISPLAY = "LED_DISPLAY",
  POS_TERMINAL = "POS_TERMINAL",
  LOOP_DETECTOR = "LOOP_DETECTOR"
}

enum DeviceStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  ERROR = "ERROR",
  MAINTENANCE = "MAINTENANCE"
}

interface HardwareCommand {
  id: string;
  deviceId: string;
  command: string;
  parameters?: any;
  status: "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED";
  response?: string;
  createdAt: string;
  executedAt?: string;
}

interface CreateHardwareDialogProps {
  onHardwareCreated: () => void;
}

function CreateHardwareDialog({ onHardwareCreated }: CreateHardwareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    ipAddress: "",
    port: "",
    config: ""
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
      
      setFormData({ name: "", type: "", ipAddress: "", port: "", config: "" });
      setIsOpen(false);
      onHardwareCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد دستگاه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          دستگاه جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد دستگاه جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نام دستگاه</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: دوربین ورودی اصلی"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">نوع دستگاه</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMERA_ENTRY">دوربین ورودی</SelectItem>
                <SelectItem value="CAMERA_EXIT">دوربین خروجی</SelectItem>
                <SelectItem value="BARRIER_ENTRY">دریازه ورودی</SelectItem>
                <SelectItem value="BARRIER_EXIT">دریازه خروجی</SelectItem>
                <SelectItem value="PRINTER">چاپگر</SelectItem>
                <SelectItem value="LED_DISPLAY">نمایشگر LED</SelectItem>
                <SelectItem value="POS_TERMINAL">دستگاه POS</SelectItem>
                <SelectItem value="LOOP_DETECTOR">حلقه القایی</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">آدرس IP</label>
            <Input
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              placeholder="192.168.1.100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">پورت</label>
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
              {loading ? "در حال ایجاد..." : "ایجاد دستگاه"}
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

function getHardwareTypeLabel(type: HardwareType) {
  const labels = {
    [HardwareType.CAMERA_ENTRY]: "دوربین ورودی",
    [HardwareType.CAMERA_EXIT]: "دوربین خروجی",
    [HardwareType.BARRIER_ENTRY]: "دریازه ورودی",
    [HardwareType.BARRIER_EXIT]: "دریازه خروجی",
    [HardwareType.PRINTER]: "چاپگر",
    [HardwareType.LED_DISPLAY]: "نمایشگر LED",
    [HardwareType.POS_TERMINAL]: "دستگاه POS",
    [HardwareType.LOOP_DETECTOR]: "حلقه القایی"
  };
  return labels[type];
}

function getHardwareTypeIcon(type: HardwareType) {
  switch (type) {
    case HardwareType.CAMERA_ENTRY:
    case HardwareType.CAMERA_EXIT:
      return <Camera className="h-5 w-5" />;
    case HardwareType.BARRIER_ENTRY:
    case HardwareType.BARRIER_EXIT:
      return <Gate className="h-5 w-5" />;
    case HardwareType.PRINTER:
      return <Printer className="h-5 w-5" />;
    case HardwareType.LED_DISPLAY:
      return <Monitor className="h-5 w-5" />;
    case HardwareType.POS_TERMINAL:
      return <Activity className="h-5 w-5" />;
    case HardwareType.LOOP_DETECTOR:
      return <Car className="h-5 w-5" />;
    default:
      return <Settings className="h-5 w-5" />;
  }
}

function getStatusBadgeVariant(status: DeviceStatus) {
  switch (status) {
    case DeviceStatus.ONLINE:
      return "default";
    case DeviceStatus.OFFLINE:
      return "secondary";
    case DeviceStatus.ERROR:
      return "destructive";
    case DeviceStatus.MAINTENANCE:
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: DeviceStatus) {
  const labels = {
    [DeviceStatus.ONLINE]: "آنلاین",
    [DeviceStatus.OFFLINE]: "آفلاین",
    [DeviceStatus.ERROR]: "خطا",
    [DeviceStatus.MAINTENANCE]: "تعمیرات"
  };
  return labels[status];
}

export default function HardwarePage() {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [commands, setCommands] = useState<HardwareCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  // Generate mock hardware devices
  const generateMockDevices = (): HardwareDevice[] => [
    {
      id: "1",
      name: "دوربین ورودی اصلی",
      type: HardwareType.CAMERA_ENTRY,
      ipAddress: "192.168.1.101",
      port: 8080,
      isActive: true,
      lastSeen: new Date().toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ resolution: "1920x1080", fps: 30, night_vision: true }),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "دوربین خروجی اصلی",
      type: HardwareType.CAMERA_EXIT,
      ipAddress: "192.168.1.102",
      port: 8080,
      isActive: true,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ resolution: "1920x1080", fps: 30, night_vision: true }),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "دریازه ورودی",
      type: HardwareType.BARRIER_ENTRY,
      ipAddress: "192.168.1.201",
      port: 9000,
      isActive: true,
      lastSeen: new Date().toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ open_time: 5, close_time: 5, auto_close: true }),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "دریازه خروجی",
      type: HardwareType.BARRIER_EXIT,
      ipAddress: "192.168.1.202",
      port: 9000,
      isActive: true,
      lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ open_time: 5, close_time: 5, auto_close: true }),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "چاپگر رسید",
      type: HardwareType.PRINTER,
      ipAddress: "192.168.1.301",
      port: 9100,
      isActive: true,
      lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ paper_size: "80mm", encoding: "UTF-8", auto_cut: true }),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "6",
      name: "نمایشگر LED",
      type: HardwareType.LED_DISPLAY,
      ipAddress: "192.168.1.401",
      port: 8888,
      isActive: true,
      lastSeen: new Date().toISOString(),
      status: DeviceStatus.ONLINE,
      config: JSON.stringify({ width: 320, height: 64, brightness: 80, scroll_speed: 3 }),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Generate mock commands
  const generateMockCommands = (): HardwareCommand[] => [
    {
      id: "1",
      deviceId: "1",
      command: "TAKE_SNAPSHOT",
      status: "COMPLETED",
      response: "Snapshot captured successfully",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: "2",
      deviceId: "3",
      command: "OPEN_BARRIER",
      status: "COMPLETED",
      response: "Barrier opened successfully",
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: "3",
      deviceId: "5",
      command: "PRINT_RECEIPT",
      parameters: { amount: 25000, plate: "۱۲۳۴۵۶۷۸" },
      status: "COMPLETED",
      response: "Receipt printed successfully",
      createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      executedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString()
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setDevices(generateMockDevices());
      setCommands(generateMockCommands());
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleDevice = async (deviceId: string, isActive: boolean) => {
    try {
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, isActive: !isActive, status: !isActive ? DeviceStatus.OFFLINE : DeviceStatus.ONLINE }
          : device
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت دستگاه");
    }
  };

  const handleSendCommand = async (deviceId: string, command: string, parameters?: any) => {
    try {
      const newCommand: HardwareCommand = {
        id: Date.now().toString(),
        deviceId,
        command,
        parameters,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };

      setCommands(prev => [newCommand, ...prev]);

      // Simulate command execution
      setTimeout(() => {
        setCommands(prev => prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, status: "EXECUTING" }
            : cmd
        ));

        setTimeout(() => {
          setCommands(prev => prev.map(cmd => 
            cmd.id === newCommand.id 
              ? { 
                  ...cmd, 
                  status: "COMPLETED", 
                  response: "Command executed successfully",
                  executedAt: new Date().toISOString() 
                }
              : cmd
          ));
        }, 2000);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارسال دستور");
    }
  };

  const handleToggleSimulation = () => {
    setSimulationActive(!simulationActive);
    
    if (!simulationActive) {
      // Start simulation - update device statuses periodically
      const interval = setInterval(() => {
        if (!simulationActive) {
          clearInterval(interval);
          return;
        }
        
        setDevices(prev => prev.map(device => ({
          ...device,
          lastSeen: new Date().toISOString(),
          status: Math.random() > 0.1 ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE
        })));
      }, 5000);
    }
  };

  const filteredDevices = devices.filter(device => device.isActive);

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
            <h1 className="text-3xl font-bold">مدیریت سخت‌افزار</h1>
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
            <CreateHardwareDialog onHardwareCreated={() => {}} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل دستگاه‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(devices.length)}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">دستگاه‌های فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(devices.filter(d => d.isActive).length)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">دستگاه‌های آنلاین</p>
                  <p className="text-2xl font-bold">
                    {toPersianNumerals(devices.filter(d => d.status === DeviceStatus.ONLINE).length)}
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
                  <p className="text-sm text-gray-600">دستگاه‌های آفلاین</p>
                  <p className="text-2xl font-bold text-red-600">
                    {toPersianNumerals(devices.filter(d => d.status === DeviceStatus.OFFLINE).length)}
                  </p>
                </div>
                <WifiOff className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hardware Tabs */}
        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devices">دستگاه‌ها</TabsTrigger>
            <TabsTrigger value="commands">دستورات</TabsTrigger>
            <TabsTrigger value="simulation">شبیه‌سازی</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>لیست دستگاه‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام دستگاه</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>آدرس شبکه</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>آخرین ارتباط</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getHardwareTypeIcon(device.type)}
                              {device.name}
                            </div>
                          </TableCell>
                          <TableCell>{getHardwareTypeLabel(device.type)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {device.ipAddress && (
                                <div>{device.ipAddress}</div>
                              )}
                              {device.port && (
                                <div className="text-gray-500">پورت: {device.port}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(device.status)}>
                              {getStatusLabel(device.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {device.lastSeen 
                              ? formatPersianDate(device.lastSeen, "HH:mm:ss")
                              : "—"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={device.isActive ? "outline" : "default"}
                                onClick={() => handleToggleDevice(device.id, device.isActive)}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDevice(device)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه دستورات</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>دستگاه</TableHead>
                        <TableHead>دستور</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>زمان ارسال</TableHead>
                        <TableHead>زمان اجرا</TableHead>
                        <TableHead>پاسخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commands.map((command) => {
                        const device = devices.find(d => d.id === command.deviceId);
                        return (
                          <TableRow key={command.id}>
                            <TableCell className="font-medium">
                              {device?.name || "ناشناس"}
                            </TableCell>
                            <TableCell>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {command.command}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                command.status === "COMPLETED" ? "default" :
                                command.status === "FAILED" ? "destructive" :
                                command.status === "EXECUTING" ? "default" : "secondary"
                              }>
                                {command.status === "PENDING" && "در انتظار"}
                                {command.status === "EXECUTING" && "در حال اجرا"}
                                {command.status === "COMPLETED" && "موفق"}
                                {command.status === "FAILED" && "ناموفق"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatPersianDate(command.createdAt, "HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              {command.executedAt 
                                ? formatPersianDate(command.executedAt, "HH:mm:ss")
                                : "—"
                              }
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {command.response || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>شبیه‌سازی دوربین</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleSendCommand("1", "TAKE_SNAPSHOT")}
                      disabled={!simulationActive}
                    >
                      <Camera className="h-4 w-4 ml-2" />
                      عکس برداری
                    </Button>
                    <Button
                      onClick={() => handleSendCommand("1", "START_RECORDING")}
                      disabled={!simulationActive}
                    >
                      <Play className="h-4 w-4 ml-2" />
                      شروع ضبط
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg text-white text-center">
                    <Camera className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">پیش‌نمایش دوربین</p>
                    <p className="text-sm text-gray-500 mt-1">FPS: 30</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>شبیه‌سازی دروازه</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleSendCommand("3", "OPEN_BARRIER")}
                      disabled={!simulationActive}
                    >
                      <Gate className="h-4 w-4 ml-2" />
                      باز کردن
                    </Button>
                    <Button
                      onClick={() => handleSendCommand("3", "CLOSE_BARRIER")}
                      disabled={!simulationActive}
                    >
                      <Gate className="h-4 w-4 ml-2" />
                      بستن
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg text-center">
                    <Gate className="h-16 w-16 mx-auto mb-2 text-gray-600" />
                    <p className="text-gray-600">وضعیت دروازه</p>
                    <Badge variant="outline" className="mt-2">بسته</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>شبیه‌سازی چاپگر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => handleSendCommand("5", "PRINT_RECEIPT", { 
                      amount: 25000, 
                      plate: "۱۲۳۴۵۶۷۸",
                      duration: 120 
                    })}
                    disabled={!simulationActive}
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 ml-2" />
                    چاپ رسید نمونه
                  </Button>
                  <div className="p-4 bg-white border rounded-lg text-sm font-mono">
                    <div className="text-center mb-2">پارکینگ هوشمند</div>
                    <div className="border-t border-b py-2 my-2">
                      <div>پلاک: ۱۲۳۴۵۶۷۸</div>
                      <div>مدت: ۲ ساعت</div>
                      <div>مبلغ: ۲۵,۰۰۰ تومان</div>
                    </div>
                    <div className="text-center text-gray-500">
                      {formatPersianDate(new Date(), "YYYY/MM/DD HH:mm")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>شبیه‌سازی نمایشگر LED</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleSendCommand("6", "SHOW_MESSAGE", { 
                        text: "خوش آمدید", 
                        color: "green" 
                      })}
                      disabled={!simulationActive}
                    >
                      <Monitor className="h-4 w-4 ml-2" />
                      پیام خوشامدگویی
                    </Button>
                    <Button
                      onClick={() => handleSendCommand("6", "SHOW_MESSAGE", { 
                        text: "ظرفیت پر", 
                        color: "red" 
                      })}
                      disabled={!simulationActive}
                    >
                      <Monitor className="h-4 w-4 ml-2" />
                      هشدار ظرفیت
                    </Button>
                  </div>
                  <div className="p-4 bg-black rounded-lg text-green-400 text-center font-mono">
                    <div className="text-lg">خوش آمدید</div>
                    <div className="text-sm text-gray-400 mt-1">ظرفیت: ۶۷/۱۰۰</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}