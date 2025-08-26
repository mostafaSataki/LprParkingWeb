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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Car, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  ParkingCircle,
  MapPin,
  ArrowUp,
  ArrowDown
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

interface ParkingLot {
  id: string;
  name: string;
  description?: string;
  totalCapacity: number;
  occupiedSpaces: number;
  floorNumber: number;
  section?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ParkingLotFormData {
  name: string;
  description: string;
  totalCapacity: number;
  floorNumber: number;
  section: string;
  isActive: boolean;
}

const mockParkingLots: ParkingLot[] = [
  {
    id: "1",
    name: "طبقه همکف",
    description: "طبقه همکف پارکینگ با دسترسی آسان",
    totalCapacity: 50,
    occupiedSpaces: 32,
    floorNumber: 0,
    section: "A",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "طبقه اول",
    description: "طبقه اول با ظرفیت متوسط",
    totalCapacity: 40,
    occupiedSpaces: 28,
    floorNumber: 1,
    section: "B",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "طبقه دوم",
    description: "طبقه دوم با فضای باز",
    totalCapacity: 35,
    occupiedSpaces: 15,
    floorNumber: 2,
    section: "C",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date()
  },
  {
    id: "4",
    name: "طبقه سوم",
    description: "طبقه سوم - ویژه مهمانان",
    totalCapacity: 25,
    occupiedSpaces: 8,
    floorNumber: 3,
    section: "D",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date()
  }
];

interface ParkingLotCardProps {
  lot: ParkingLot;
  onEdit: (lot: ParkingLot) => void;
  onDelete: (lotId: string) => void;
  onUpdateCapacity: (lotId: string, change: number) => void;
}

function ParkingLotCard({ lot, onEdit, onDelete, onUpdateCapacity }: ParkingLotCardProps) {
  const occupancyRate = (lot.occupiedSpaces / lot.totalCapacity) * 100;
  const availableSpaces = lot.totalCapacity - lot.occupiedSpaces;
  
  let statusColor = "text-green-600";
  let statusBadge = "default";
  if (occupancyRate > 90) {
    statusColor = "text-red-600";
    statusBadge = "destructive";
  } else if (occupancyRate > 75) {
    statusColor = "text-orange-600";
    statusBadge = "default";
  } else if (occupancyRate > 50) {
    statusColor = "text-yellow-600";
    statusBadge = "secondary";
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">{lot.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={statusBadge as any}>
              {lot.floorNumber === 0 ? "همکف" : `طبقه ${lot.floorNumber}`}
            </Badge>
            {!lot.isActive && <Badge variant="outline">غیرفعال</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {toPersianNumerals(lot.totalCapacity)}
            </div>
            <div className="text-sm text-gray-600">ظرفیت کل</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className={`text-2xl font-bold ${statusColor}`}>
              {toPersianNumerals(availableSpaces)}
            </div>
            <div className="text-sm text-gray-600">خالی</div>
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">اشغال:</span>
            <span className="font-semibold">{toPersianNumerals(lot.occupiedSpaces)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                occupancyRate > 90 ? "bg-red-500" : 
                occupancyRate > 75 ? "bg-orange-500" : 
                occupancyRate > 50 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            {toPersianNumerals(Math.round(occupancyRate))}% اشغال شده
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2">
          {occupancyRate > 90 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                این طبقه تقریباً پر شده است
              </AlertDescription>
            </Alert>
          )}
          
          {occupancyRate < 20 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                این طبقه ظرفیت خالی زیادی دارد
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateCapacity(lot.id, 1)}
            >
              <ArrowUp className="h-4 w-4 ml-1" />
              ورود
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateCapacity(lot.id, -1)}
            >
              <ArrowDown className="h-4 w-4 ml-1" />
              خروج
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(lot)}
            >
              <Edit className="h-4 w-4 ml-1" />
              ویرایش
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onDelete(lot.id)}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              حذف
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        {lot.description && (
          <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
            {lot.description}
          </div>
        )}
        
        {lot.section && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>بخش: {lot.section}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ParkingLotFormProps {
  lot?: ParkingLot;
  onSave: (data: ParkingLotFormData) => void;
  onCancel: () => void;
}

function ParkingLotForm({ lot, onSave, onCancel }: ParkingLotFormProps) {
  const [formData, setFormData] = useState<ParkingLotFormData>({
    name: lot?.name || "",
    description: lot?.description || "",
    totalCapacity: lot?.totalCapacity || 30,
    floorNumber: lot?.floorNumber || 0,
    section: lot?.section || "",
    isActive: lot?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">نام طبقه</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: طبقه همکف"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floorNumber">شماره طبقه</Label>
          <Input
            id="floorNumber"
            type="number"
            min="0"
            value={formData.floorNumber}
            onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalCapacity">ظرفیت کل</Label>
          <Input
            id="totalCapacity"
            type="number"
            min="1"
            value={formData.totalCapacity}
            onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">بخش</Label>
        <Input
          id="section"
          value={formData.section}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
          placeholder="مثال: A, B, C"
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
          {lot ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default function ParkingFloorsManagement() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>(mockParkingLots);
  const [editingLot, setEditingLot] = useState<ParkingLot | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  // Calculate overall statistics
  const totalStats = parkingLots.reduce((stats, lot) => {
    if (!lot.isActive) return stats;
    return {
      totalCapacity: stats.totalCapacity + lot.totalCapacity,
      occupiedSpaces: stats.occupiedSpaces + lot.occupiedSpaces,
      activeLots: stats.activeLots + 1
    };
  }, { totalCapacity: 0, occupiedSpaces: 0, activeLots: 0 });

  const overallOccupancyRate = totalStats.totalCapacity > 0 
    ? (totalStats.occupiedSpaces / totalStats.totalCapacity) * 100 
    : 0;

  const handleSaveLot = (formData: ParkingLotFormData) => {
    if (editingLot) {
      // Update existing lot
      setParkingLots(parkingLots.map(lot => 
        lot.id === editingLot.id 
          ? { 
              ...lot, 
              ...formData, 
              updatedAt: new Date() 
            }
          : lot
      ));
    } else {
      // Create new lot
      const newLot: ParkingLot = {
        id: Date.now().toString(),
        ...formData,
        occupiedSpaces: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setParkingLots([...parkingLots, newLot]);
    }
    setIsFormDialogOpen(false);
    setEditingLot(null);
  };

  const handleEditLot = (lot: ParkingLot) => {
    setEditingLot(lot);
    setIsFormDialogOpen(true);
  };

  const handleDeleteLot = (lotId: string) => {
    if (confirm("آیا از حذف این طبقه اطمینان دارید؟")) {
      setParkingLots(parkingLots.filter(lot => lot.id !== lotId));
    }
  };

  const handleUpdateCapacity = (lotId: string, change: number) => {
    setParkingLots(parkingLots.map(lot => {
      if (lot.id === lotId) {
        const newOccupied = Math.max(0, Math.min(lot.totalCapacity, lot.occupiedSpaces + change));
        return { ...lot, occupiedSpaces: newOccupied };
      }
      return lot;
    }));
  };

  const handleAddNewLot = () => {
    setEditingLot(null);
    setIsFormDialogOpen(true);
  };

  const sortedLots = [...parkingLots].sort((a, b) => a.floorNumber - b.floorNumber);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت طبقات پارکینگ</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date())}
            </p>
          </div>
          <Button onClick={handleAddNewLot}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن طبقه جدید
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تعداد طبقات</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(totalStats.activeLots)}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ظرفیت کل</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(totalStats.totalCapacity)}</p>
                </div>
                <Car className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اشغال شده</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {toPersianNumerals(totalStats.occupiedSpaces)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">میزان اشغال</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(Math.round(overallOccupancyRate))}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Occupancy Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ParkingCircle className="h-5 w-5" />
              وضعیت کلی پارکینگ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">تعداد کل فضاهای اشغال شده:</span>
                <span className="font-semibold">{toPersianNumerals(totalStats.occupiedSpaces)} از {toPersianNumerals(totalStats.totalCapacity)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${
                    overallOccupancyRate > 90 ? "bg-red-500" : 
                    overallOccupancyRate > 75 ? "bg-orange-500" : 
                    overallOccupancyRate > 50 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(overallOccupancyRate, 100)}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-semibold ${
                  overallOccupancyRate > 90 ? "text-red-600" : 
                  overallOccupancyRate > 75 ? "text-orange-600" : 
                  overallOccupancyRate > 50 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {toPersianNumerals(Math.round(overallOccupancyRate))}%
                </span>
                <span className="text-gray-500 mr-2">اشغال شده</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parking Lots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedLots.map((lot) => (
            <ParkingLotCard
              key={lot.id}
              lot={lot}
              onEdit={handleEditLot}
              onDelete={handleDeleteLot}
              onUpdateCapacity={handleUpdateCapacity}
            />
          ))}
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLot ? "ویرایش طبقه پارکینگ" : "ایجاد طبقه پارکینگ جدید"}
              </DialogTitle>
            </DialogHeader>
            <ParkingLotForm
              lot={editingLot || undefined}
              onSave={handleSaveLot}
              onCancel={() => setIsFormDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}