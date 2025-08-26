"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Camera, 
  MapPin, 
  Settings,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Eye,
  Play,
  Pause,
  Users,
  Car
} from "lucide-react";

function formatPersianDate(date: Date | string): string {
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

function toPersianNumerals(num: number | string): string {
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
}

// Types
interface ParkingLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  cameras: Camera[];
  parkingLots: ParkingLot[];
}

interface Camera {
  id: string;
  locationId: string;
  name: string;
  type: "ENTRY" | "EXIT" | "BOTH";
  direction: "IN" | "OUT";
  isActive: boolean;
  ipAddress?: string;
  rtspUrl?: string;
  resolution?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ParkingLot {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  totalCapacity: number;
  occupiedSpaces: number;
  floorNumber?: number;
  section?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LocationFormData {
  name: string;
  description: string;
  address: string;
  isActive: boolean;
}

interface CameraFormData {
  name: string;
  type: "ENTRY" | "EXIT" | "BOTH";
  direction: "IN" | "OUT";
  ipAddress?: string;
  rtspUrl?: string;
  resolution?: string;
  notes?: string;
  isActive: boolean;
}

// Mock Data
const mockLocations: ParkingLocation[] = [
  {
    id: "1",
    name: "پارکینگ مرکزی",
    description: "پارکینگ اصلی مرکز تجاری",
    address: "میدان آزادی، خیابان آزادی",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    cameras: [
      {
        id: "1",
        locationId: "1",
        name: "دوربین ورودی اصلی",
        type: "ENTRY",
        direction: "IN",
        isActive: true,
        ipAddress: "192.168.1.100",
        rtspUrl: "rtsp://192.168.1.100:554/stream",
        resolution: "1920x1080",
        notes: "دوربین اصلی ورود",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date()
      },
      {
        id: "2",
        locationId: "1",
        name: "دوربین خروجی اصلی",
        type: "EXIT",
        direction: "OUT",
        isActive: true,
        ipAddress: "192.168.1.101",
        rtspUrl: "rtsp://192.168.1.101:554/stream",
        resolution: "1920x1080",
        notes: "دوربین اصلی خروج",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date()
      }
    ],
    parkingLots: [
      {
        id: "1",
        locationId: "1",
        name: "طبقه همکف",
        totalCapacity: 50,
        occupiedSpaces: 32,
        floorNumber: 0,
        section: "A",
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: "2",
    name: "پارکینگ غرب",
    description: "پارکینگ مجتمع تجاری غرب",
    address: "بلوار کشاورز، خیابان غربی",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    cameras: [
      {
        id: "3",
        locationId: "2",
        name: "دوربین ورودی غرب",
        type: "ENTRY",
        direction: "IN",
        isActive: true,
        ipAddress: "192.168.1.102",
        rtspUrl: "rtsp://192.168.1.102:554/stream",
        resolution: "1280x720",
        notes: "دوربین ورودی پارکینگ غرب",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date()
      }
    ],
    parkingLots: []
  },
  {
    id: "3",
    name: "پارکینگ شرق",
    description: "پارکینگ مجتمع اداری شرق",
    address: "خیابان امام خمینی، خیابان شرقی",
    isActive: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    cameras: [],
    parkingLots: []
  }
];

// Components
interface LocationCardProps {
  location: ParkingLocation;
  onEdit: (location: ParkingLocation) => void;
  onDelete: (locationId: string) => void;
  onManageCameras: (location: ParkingLocation) => void;
  onManageLots: (location: ParkingLocation) => void;
}

function LocationCard({ location, onEdit, onDelete, onManageCameras, onManageLots }: LocationCardProps) {
  const activeCameras = location.cameras.filter(c => c.isActive).length;
  const totalCapacity = location.parkingLots.reduce((sum, lot) => sum + lot.totalCapacity, 0);
  const occupiedSpaces = location.parkingLots.reduce((sum, lot) => sum + lot.occupiedSpaces, 0);
  const occupancyRate = totalCapacity > 0 ? (occupiedSpaces / totalCapacity) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            {location.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={location.isActive ? "default" : "secondary"}>
              {location.isActive ? "فعال" : "غیرفعال"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {location.description && (
          <p className="text-sm text-gray-600">{location.description}</p>
        )}
        
        {location.address && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{location.address}</span>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">
              {toPersianNumerals(activeCameras)}
            </div>
            <div className="text-xs text-gray-600">دوربین فعال</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">
              {toPersianNumerals(location.parkingLots.length)}
            </div>
            <div className="text-xs text-gray-600">طبقه پارکینگ</div>
          </div>
        </div>

        {/* Occupancy */}
        {location.parkingLots.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ظرفیت:</span>
              <span className="font-semibold">{toPersianNumerals(totalCapacity)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">اشغال:</span>
              <span className="font-semibold">{toPersianNumerals(occupiedSpaces)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  occupancyRate > 80 ? "bg-red-500" : 
                  occupancyRate > 60 ? "bg-orange-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {toPersianNumerals(Math.round(occupancyRate))}% اشغال
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onManageCameras(location)}
            >
              <Camera className="h-4 w-4 ml-1" />
              دوربین‌ها
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onManageLots(location)}
            >
              <Building className="h-4 w-4 ml-1" />
              طبقات
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(location)}
            >
              <Edit className="h-4 w-4 ml-1" />
              ویرایش
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onDelete(location.id)}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              حذف
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CameraCardProps {
  camera: Camera;
  onEdit: (camera: Camera) => void;
  onDelete: (cameraId: string) => void;
  onToggleStatus: (cameraId: string) => void;
}

function CameraCard({ camera, onEdit, onDelete, onToggleStatus }: CameraCardProps) {
  const getTypeLabel = (type: string) => {
    const labels = {
      "ENTRY": "ورودی",
      "EXIT": "خروجی", 
      "BOTH": "هر دو"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDirectionLabel = (direction: string) => {
    const labels = {
      "IN": "ورود",
      "OUT": "خروج"
    };
    return labels[direction as keyof typeof labels] || direction;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-500" />
            {camera.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={camera.isActive ? "default" : "secondary"}>
              {camera.isActive ? "فعال" : "غیرفعال"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">نوع:</span>
            <p className="font-medium">{getTypeLabel(camera.type)}</p>
          </div>
          <div>
            <span className="text-gray-600">جهت:</span>
            <p className="font-medium">{getDirectionLabel(camera.direction)}</p>
          </div>
        </div>

        {camera.ipAddress && (
          <div className="text-sm">
            <span className="text-gray-600">IP:</span>
            <p className="font-mono text-xs">{camera.ipAddress}</p>
          </div>
        )}

        {camera.resolution && (
          <div className="text-sm">
            <span className="text-gray-600">رزولوشن:</span>
            <p className="font-medium">{camera.resolution}</p>
          </div>
        )}

        {camera.notes && (
          <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
            {camera.notes}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={camera.isActive ? "destructive" : "default"}
            onClick={() => onToggleStatus(camera.id)}
            className="flex-1"
          >
            {camera.isActive ? (
              <>
                <Pause className="h-4 w-4 ml-1" />
                غیرفعال
              </>
            ) : (
              <>
                <Play className="h-4 w-4 ml-1" />
                فعال
              </>
            )}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(camera)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(camera.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Forms
interface LocationFormProps {
  location?: ParkingLocation;
  onSave: (data: LocationFormData) => void;
  onCancel: () => void;
}

function LocationForm({ location, onSave, onCancel }: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || "",
    description: location?.description || "",
    address: location?.address || "",
    isActive: location?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">نام محل</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: پارکینگ مرکزی"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="توضیحات اختیاری"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">آدرس</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="آدرس کامل"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">فعال</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {location ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          انصراف
        </Button>
      </div>
    </form>
  );
}

interface CameraFormProps {
  camera?: Camera;
  locationId: string;
  onSave: (data: CameraFormData) => void;
  onCancel: () => void;
}

function CameraForm({ camera, locationId, onSave, onCancel }: CameraFormProps) {
  const [formData, setFormData] = useState<CameraFormData>({
    name: camera?.name || "",
    type: camera?.type || "ENTRY",
    direction: camera?.direction || "IN",
    ipAddress: camera?.ipAddress || "",
    rtspUrl: camera?.rtspUrl || "",
    resolution: camera?.resolution || "",
    notes: camera?.notes || "",
    isActive: camera?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">نام دوربین</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: دوربین ورودی اصلی"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">نوع دوربین</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: any) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENTRY">ورودی</SelectItem>
              <SelectItem value="EXIT">خروجی</SelectItem>
              <SelectItem value="BOTH">هر دو</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">جهت</Label>
          <Select 
            value={formData.direction} 
            onValueChange={(value: any) => setFormData({ ...formData, direction: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN">ورود</SelectItem>
              <SelectItem value="OUT">خروج</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ipAddress">آدرس IP</Label>
          <Input
            id="ipAddress"
            value={formData.ipAddress}
            onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
            placeholder="192.168.1.100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution">رزولوشن</Label>
          <Input
            id="resolution"
            value={formData.resolution}
            onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            placeholder="1920x1080"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtspUrl">آدرس RTSP</Label>
        <Input
          id="rtspUrl"
          value={formData.rtspUrl}
          onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
          placeholder="rtsp://192.168.1.100:554/stream"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">یادداشت‌ها</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="یادداشت‌های اختیاری"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">فعال</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {camera ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          انصراف
        </Button>
      </div>
    </form>
  );
}

// Main Component
export default function ParkingLocationManagement() {
  const [locations, setLocations] = useState<ParkingLocation[]>(mockLocations);
  const [editingLocation, setEditingLocation] = useState<ParkingLocation | null>(null);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isCameraFormOpen, setIsCameraFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("locations");

  // Calculate statistics
  const stats = {
    totalLocations: locations.length,
    activeLocations: locations.filter(l => l.isActive).length,
    totalCameras: locations.reduce((sum, l) => sum + l.cameras.length, 0),
    activeCameras: locations.reduce((sum, l) => sum + l.cameras.filter(c => c.isActive).length, 0),
    totalCapacity: locations.reduce((sum, l) => 
      sum + l.parkingLots.reduce((lotSum, lot) => lotSum + lot.totalCapacity, 0), 0
    ),
    occupiedSpaces: locations.reduce((sum, l) => 
      sum + l.parkingLots.reduce((lotSum, lot) => lotSum + lot.occupiedSpaces, 0), 0
    )
  };

  const handleSaveLocation = (formData: LocationFormData) => {
    if (editingLocation) {
      // Update existing location
      setLocations(locations.map(loc => 
        loc.id === editingLocation.id 
          ? { 
              ...loc, 
              ...formData, 
              updatedAt: new Date() 
            }
          : loc
      ));
    } else {
      // Create new location
      const newLocation: ParkingLocation = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        cameras: [],
        parkingLots: []
      };
      setLocations([...locations, newLocation]);
    }
    setIsLocationFormOpen(false);
    setEditingLocation(null);
  };

  const handleSaveCamera = (formData: CameraFormData) => {
    if (!selectedLocation) return;

    const cameraData: Camera = {
      ...formData,
      id: editingCamera?.id || Date.now().toString(),
      locationId: selectedLocation.id,
      createdAt: editingCamera?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingCamera) {
      // Update existing camera
      setLocations(locations.map(loc => {
        if (loc.id === selectedLocation.id) {
          return {
            ...loc,
            cameras: loc.cameras.map(cam => 
              cam.id === editingCamera.id ? cameraData : cam
            )
          };
        }
        return loc;
      }));
    } else {
      // Create new camera
      setLocations(locations.map(loc => {
        if (loc.id === selectedLocation.id) {
          return {
            ...loc,
            cameras: [...loc.cameras, cameraData]
          };
        }
        return loc;
      }));
    }
    setIsCameraFormOpen(false);
    setEditingCamera(null);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm("آیا از حذف این محل اطمینان دارید؟")) {
      setLocations(locations.filter(loc => loc.id !== locationId));
    }
  };

  const handleDeleteCamera = (cameraId: string) => {
    if (!selectedLocation) return;
    
    if (confirm("آیا از حذف این دوربین اطمینان دارید؟")) {
      setLocations(locations.map(loc => {
        if (loc.id === selectedLocation.id) {
          return {
            ...loc,
            cameras: loc.cameras.filter(cam => cam.id !== cameraId)
          };
        }
        return loc;
      }));
    }
  };

  const handleToggleCameraStatus = (cameraId: string) => {
    if (!selectedLocation) return;
    
    setLocations(locations.map(loc => {
      if (loc.id === selectedLocation.id) {
        return {
          ...loc,
          cameras: loc.cameras.map(cam => 
            cam.id === cameraId 
              ? { ...cam, isActive: !cam.isActive, updatedAt: new Date() }
              : cam
          )
        };
      }
      return loc;
    }));
  };

  const handleManageCameras = (location: ParkingLocation) => {
    setSelectedLocation(location);
    setActiveTab("cameras");
  };

  const handleManageLots = (location: ParkingLocation) => {
    setSelectedLocation(location);
    setActiveTab("lots");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت محل‌ها و دوربین‌ها</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date())}
            </p>
          </div>
          <Button onClick={() => {
            setEditingLocation(null);
            setIsLocationFormOpen(true);
          }}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن محل جدید
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل محل‌ها</p>
                  <p className="text-xl font-bold">{toPersianNumerals(stats.totalLocations)}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">محل‌های فعال</p>
                  <p className="text-xl font-bold text-green-600">{toPersianNumerals(stats.activeLocations)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل دوربین‌ها</p>
                  <p className="text-xl font-bold">{toPersianNumerals(stats.totalCameras)}</p>
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
                  <p className="text-xl font-bold text-blue-600">{toPersianNumerals(stats.activeCameras)}</p>
                </div>
                <Wifi className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ظرفیت کل</p>
                  <p className="text-xl font-bold">{toPersianNumerals(stats.totalCapacity)}</p>
                </div>
                <Car className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اشغال شده</p>
                  <p className="text-xl font-bold text-red-600">{toPersianNumerals(stats.occupiedSpaces)}</p>
                </div>
                <Users className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="locations">محل‌های پارکینگ</TabsTrigger>
            <TabsTrigger value="cameras" disabled={!selectedLocation}>دوربین‌ها</TabsTrigger>
            <TabsTrigger value="lots" disabled={!selectedLocation}>طبقات پارکینگ</TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onEdit={(loc) => {
                    setEditingLocation(loc);
                    setIsLocationFormOpen(true);
                  }}
                  onDelete={handleDeleteLocation}
                  onManageCameras={handleManageCameras}
                  onManageLots={handleManageLots}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cameras" className="space-y-4">
            {selectedLocation && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">دوربین‌های {selectedLocation.name}</h2>
                    <p className="text-gray-600">{selectedLocation.address}</p>
                  </div>
                  <Button onClick={() => {
                    setEditingCamera(null);
                    setIsCameraFormOpen(true);
                  }}>
                    <Plus className="h-4 w-4 ml-2" />
                    افزودن دوربین
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedLocation.cameras.map((camera) => (
                    <CameraCard
                      key={camera.id}
                      camera={camera}
                      onEdit={(cam) => {
                        setEditingCamera(cam);
                        setIsCameraFormOpen(true);
                      }}
                      onDelete={handleDeleteCamera}
                      onToggleStatus={handleToggleCameraStatus}
                    />
                  ))}
                </div>

                {selectedLocation.cameras.length === 0 && (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">هیچ دوربینی برای این محل تعریف نشده است</p>
                    <Button className="mt-4" onClick={() => setIsCameraFormOpen(true)}>
                      افزودن اولین دوربین
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="lots" className="space-y-4">
            {selectedLocation && (
              <div className="text-center py-12">
                <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">مدیریت طبقات پارکینگ</p>
                <p className="text-sm text-gray-400 mt-2">
                  این بخش در صفحه مدیریت طبقات پارکینگ در دسترس است
                </p>
                <Button className="mt-4" variant="outline">
                  رفتن به مدیریت طبقات
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Location Form Dialog */}
        <Dialog open={isLocationFormOpen} onOpenChange={setIsLocationFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "ویرایش محل پارکینگ" : "ایجاد محل پارکینگ جدید"}
              </DialogTitle>
            </DialogHeader>
            <LocationForm
              location={editingLocation || undefined}
              onSave={handleSaveLocation}
              onCancel={() => setIsLocationFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Camera Form Dialog */}
        <Dialog open={isCameraFormOpen} onOpenChange={setIsCameraFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCamera ? "ویرایش دوربین" : "ایجاد دوربین جدید"}
              </DialogTitle>
            </DialogHeader>
            {selectedLocation && (
              <CameraForm
                camera={editingCamera || undefined}
                locationId={selectedLocation.id}
                onSave={handleSaveCamera}
                onCancel={() => setIsCameraFormOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}