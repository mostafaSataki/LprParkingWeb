"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ArrowDown,
  Loader2
} from "lucide-react";
import { useSearchParams } from 'next/navigation';

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
  location: {
    id: string;
    name: string;
    address: string;
  };
  status?: {
    totalCapacity: number;
    occupiedSpaces: number;
    availableSpaces: number;
    lastUpdated: Date;
  };
  _count: {
    parkingSpots: number;
    sessions: number;
  };
}

interface ParkingLocation {
  id: string;
  name: string;
}

interface ParkingLotFormData {
  locationId: string;
  name: string;
  description: string;
  totalCapacity: number;
  floorNumber: number;
  section: string;
  isActive: boolean;
}

// API Service
class ParkingLotsAPI {
  static async getLots(locationId?: string): Promise<ParkingLot[]> {
    const url = new URL('/api/parking-lots', window.location.origin);
    if (locationId) {
      url.searchParams.append('locationId', locationId);
    }
    
    const response = await fetch(url.toString());
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست طبقات پارکینگ');
    }
    return result.data;
  }

  static async createLot(data: ParkingLotFormData): Promise<ParkingLot> {
    const response = await fetch('/api/parking-lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در ایجاد طبقه پارکینگ');
    }
    return result.data;
  }

  static async updateLot(id: string, data: Partial<ParkingLotFormData>): Promise<ParkingLot> {
    const response = await fetch(`/api/parking-lots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در به‌روزرسانی طبقه پارکینگ');
    }
    return result.data;
  }

  static async deleteLot(id: string): Promise<void> {
    const response = await fetch(`/api/parking-lots/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در حذف طبقه پارکینگ');
    }
  }
}

class ParkingLocationsAPI {
  static async getLocations(): Promise<ParkingLocation[]> {
    const response = await fetch('/api/parking-locations');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست محل‌های پارکینگ');
    }
    return result.data.map((loc: any) => ({
      id: loc.id,
      name: loc.name
    }));
  }
}

// Components
interface ParkingLotCardProps {
  lot: ParkingLot;
  onEdit: (lot: ParkingLot) => void;
  onDelete: (lotId: string) => void;
  onUpdateCapacity: (lotId: string, change: number) => void;
}

function ParkingLotCard({ lot, onEdit, onDelete, onUpdateCapacity }: ParkingLotCardProps) {
  const occupancyRate = lot.totalCapacity > 0 ? (lot.occupiedSpaces / lot.totalCapacity) * 100 : 0;
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
        {/* Location Info */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>{lot.location.name}</span>
        </div>

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
              disabled={!lot.isActive}
            >
              <ArrowUp className="h-4 w-4 ml-1" />
              ورود
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateCapacity(lot.id, -1)}
              disabled={!lot.isActive || lot.occupiedSpaces === 0}
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
            <ParkingCircle className="h-4 w-4" />
            <span>بخش: {lot.section}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold">{toPersianNumerals(lot._count.parkingSpots)}</div>
            <div>جای پارک</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-semibold">{toPersianNumerals(lot._count.sessions)}</div>
            <div>جلسه فعال</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ParkingLotFormProps {
  lot?: ParkingLot;
  locations: ParkingLocation[];
  onSave: (data: ParkingLotFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ParkingLotForm({ lot, locations, onSave, onCancel, isLoading }: ParkingLotFormProps) {
  const [formData, setFormData] = useState<ParkingLotFormData>({
    locationId: lot?.location.id || "",
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
        <Label htmlFor="locationId">محل پارکینگ</Label>
        <Select
          value={formData.locationId}
          onValueChange={(value) => setFormData({ ...formData, locationId: value })}
          disabled={isLoading || !!lot}
        >
          <SelectTrigger>
            <SelectValue placeholder="محل پارکینگ را انتخاب کنید" />
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

      <div className="space-y-2">
        <Label htmlFor="name">نام طبقه</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="مثال: طبقه همکف"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="توضیحات اختیاری"
          disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
          disabled={isLoading}
        />
        <Label htmlFor="isActive">فعال</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
          {lot ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default function ParkingFloorsManagement() {
  const searchParams = useSearchParams();
  const locationIdParam = searchParams.get('locationId');
  
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [editingLot, setEditingLot] = useState<ParkingLot | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [locationIdParam]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [lotsData, locationsData] = await Promise.all([
        ParkingLotsAPI.getLots(locationIdParam || undefined),
        ParkingLocationsAPI.getLocations()
      ]);
      
      setParkingLots(lotsData);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLot = async (formData: ParkingLotFormData) => {
    try {
      setActionLoading(true);
      setError(null);

      if (editingLot) {
        // Update existing lot
        const updatedLot = await ParkingLotsAPI.updateLot(
          editingLot.id, 
          formData
        );
        setParkingLots(parkingLots.map(lot => 
          lot.id === editingLot.id ? updatedLot : lot
        ));
      } else {
        // Create new lot
        const newLot = await ParkingLotsAPI.createLot(formData);
        setParkingLots([...parkingLots, newLot]);
      }
      
      setIsFormDialogOpen(false);
      setEditingLot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLot = (lot: ParkingLot) => {
    setEditingLot(lot);
    setIsFormDialogOpen(true);
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm("آیا از حذف این طبقه اطمینان دارید؟")) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await ParkingLotsAPI.deleteLot(lotId);
      setParkingLots(parkingLots.filter(lot => lot.id !== lotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف طبقه پارکینگ');
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold">مدیریت طبقات پارکینگ</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date())}
              {locationIdParam && (
                <span className="mr-4 text-blue-600">
                  (فیلتر شده بر اساس محل پارکینگ)
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleAddNewLot}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن طبقه جدید
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                  <p className="text-sm text-gray-600">درصد اشغال</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {toPersianNumerals(Math.round(overallOccupancyRate))}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Occupancy Rate */}
        {totalStats.totalCapacity > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">میانگین اشغال کلی:</span>
                  <span className="font-semibold">{toPersianNumerals(Math.round(overallOccupancyRate))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      overallOccupancyRate > 80 ? "bg-red-500" : 
                      overallOccupancyRate > 60 ? "bg-orange-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(overallOccupancyRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parking Lots Grid */}
        {parkingLots.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">هیچ طبقه پارکینگی تعریف نشده</h3>
              <p className="text-gray-600 mb-4">
                برای شروع، یک طبقه پارکینگ جدید ایجاد کنید
              </p>
              <Button onClick={handleAddNewLot}>
                <Plus className="h-4 w-4 ml-2" />
                ایجاد طبقه پارکینگ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingLots
              .sort((a, b) => {
                // Sort by location name, then by floor number
                if (a.location.name !== b.location.name) {
                  return a.location.name.localeCompare(b.location.name);
                }
                return a.floorNumber - b.floorNumber;
              })
              .map((lot) => (
              <ParkingLotCard
                key={lot.id}
                lot={lot}
                onEdit={handleEditLot}
                onDelete={handleDeleteLot}
                onUpdateCapacity={handleUpdateCapacity}
              />
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLot ? "ویرایش طبقه پارکینگ" : "ایجاد طبقه پارکینگ جدید"}
              </DialogTitle>
            </DialogHeader>
            <ParkingLotForm
              lot={editingLot}
              locations={locations}
              onSave={handleSaveLot}
              onCancel={() => {
                setIsFormDialogOpen(false);
                setEditingLot(null);
              }}
              isLoading={actionLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}