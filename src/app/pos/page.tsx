"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  AlertTriangle,
  X
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface POSDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  isActive: boolean;
  lastSeen?: Date;
  status: 'online' | 'offline' | 'error';
  pendingTransactions: number;
  totalAmount: number;
  error?: string;
}

interface POSFormData {
  name: string;
  ipAddress: string;
  port: number;
  isActive: boolean;
}

export default function POSManagement() {
  const [devices, setDevices] = useState<POSDevice[]>([
    {
      id: "1",
      name: "دستگاه POS اصلی",
      ipAddress: "192.168.1.100",
      port: 8080,
      isActive: true,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      status: "online",
      pendingTransactions: 0,
      totalAmount: 0
    },
    {
      id: "2",
      name: "دستگاه POS پشتیبان",
      ipAddress: "192.168.1.101",
      port: 8080,
      isActive: true,
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
      status: "online",
      pendingTransactions: 0,
      totalAmount: 0
    }
  ]);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceForm, setDeviceForm] = useState<POSFormData>({
    name: "",
    ipAddress: "",
    port: 8080,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  // Load POS status periodically
  useEffect(() => {
    loadPOSStatus();
    const interval = setInterval(loadPOSStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPOSStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/status');
      const status = await response.json();
      
      // Update device status
      setDevices(prevDevices => 
        prevDevices.map(device => ({
          ...device,
          status: status.isConnected ? 'online' : 'offline',
          lastTransaction: status.lastTransaction,
          pendingTransactions: status.pendingTransactions,
          totalAmount: status.totalAmount,
          error: status.error
        }))
      );
    } catch (error) {
      console.error('Error loading POS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDevice) {
      // Update existing device
      setDevices(devices.map(device => 
        device.id === editingDevice 
          ? { ...device, ...deviceForm }
          : device
      ));
    } else {
      // Add new device
      const newDevice: POSDevice = {
        id: Date.now().toString(),
        ...deviceForm,
        status: 'offline',
        pendingTransactions: 0,
        totalAmount: 0
      };
      setDevices([...devices, newDevice]);
    }
    
    setShowDeviceForm(false);
    setEditingDevice(null);
    setDeviceForm({
      name: "",
      ipAddress: "",
      port: 8080,
      isActive: true
    });
  };

  const editDevice = (device: POSDevice) => {
    setDeviceForm({
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      isActive: device.isActive
    });
    setEditingDevice(device.id);
    setShowDeviceForm(true);
  };

  const deleteDevice = (id: string) => {
    setDevices(devices.filter(device => device.id !== id));
  };

  const testDevice = async (device: POSDevice) => {
    try {
      const response = await fetch('/api/pos/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: device.id,
          test: true
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update device status
        setDevices(devices.map(d => 
          d.id === device.id 
            ? { 
                ...d, 
                status: 'online',
                lastSeen: new Date(),
                error: undefined
              }
            : d
        ));
      }
    } catch (error) {
      console.error('Error testing device:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      online: 'آنلاین',
      offline: 'آفلاین',
      error: 'خطا'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت دستگاه‌های POS</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={loadPOSStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              به‌روزرسانی وضعیت
            </Button>
            <Button onClick={() => setShowDeviceForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              دستگاه جدید
            </Button>
          </div>
        </div>

        {/* Device Form */}
        {showDeviceForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingDevice ? "ویرایش دستگاه" : "دستگاه جدید"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeviceForm(false);
                    setEditingDevice(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeviceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceName">نام دستگاه</Label>
                    <Input
                      id="deviceName"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deviceIp">آدرس IP</Label>
                    <Input
                      id="deviceIp"
                      value={deviceForm.ipAddress}
                      onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="devicePort">پورت</Label>
                    <Input
                      id="devicePort"
                      type="number"
                      value={deviceForm.port}
                      onChange={(e) => setDeviceForm({ ...deviceForm, port: parseInt(e.target.value) })}
                      min={1}
                      max={65535}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="deviceActive"
                      checked={deviceForm.isActive}
                      onChange={(e) => setDeviceForm({ ...deviceForm, isActive: e.target.checked })}
                    />
                    <Label htmlFor="deviceActive">فعال</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDeviceForm(false)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    <CheckCircle className="h-4 w-4 ml-2" />
                    ذخیره
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    {device.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(device.status)}
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {getStatusLabel(device.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">آدرس IP:</span>
                    <span className="font-mono">{device.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">پورت:</span>
                    <span>{device.port}</span>
                  </div>
                  {device.lastSeen && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">آخرین فعالیت:</span>
                      <span>{formatPersianDate(device.lastSeen, 'HH:mm:ss')}</span>
                    </div>
                  )}
                </div>

                {/* Device Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-blue-600 font-semibold">
                      {toPersianNumerals(device.pendingTransactions)}
                    </div>
                    <div className="text-blue-600">تراکنش معلق</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-green-600 font-semibold">
                      {toPersianNumerals(device.totalAmount.toLocaleString())}
                    </div>
                    <div className="text-green-600">مجموع (تومان)</div>
                  </div>
                </div>

                {/* Error Display */}
                {device.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{device.error}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editDevice(device)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => testDevice(device)}>
                      <Activity className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteDevice(device.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              وضعیت سیستم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {toPersianNumerals(devices.filter(d => d.status === 'online').length)}
                </div>
                <div className="text-sm text-gray-600">دستگاه‌های آنلاین</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {toPersianNumerals(devices.reduce((sum, d) => sum + d.pendingTransactions, 0))}
                </div>
                <div className="text-sm text-gray-600">تراکنش‌های معلق</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {toPersianNumerals(devices.reduce((sum, d) => sum + d.totalAmount, 0).toLocaleString())}
                </div>
                <div className="text-sm text-gray-600">مجموع پرداخت‌ها (تومان)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}