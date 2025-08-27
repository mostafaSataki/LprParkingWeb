"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Camera, 
  MapPin, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader2
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
  _count: {
    cameras: number;
    parkingLots: number;
    doors: number;
  };
}

interface Camera {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT" | "BOTH";
  direction: "IN" | "OUT";
  isActive: boolean;
  ipAddress?: string;
  resolution?: string;
}

interface ParkingLot {
  id: string;
  name: string;
  totalCapacity: number;
  occupiedSpaces: number;
  floorNumber?: number;
  section?: string;
  isActive: boolean;
}

interface LocationFormData {
  name: string;
  description: string;
  address: string;
  isActive: boolean;
}

// API Service
class ParkingLocationsAPI {
  static async getLocations(): Promise<ParkingLocation[]> {
    const response = await fetch('/api/parking-locations');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست محل‌های پارکینگ');
    }
    return result.data;
  }

  static async createLocation(data: LocationFormData): Promise<ParkingLocation> {
    const response = await fetch('/api/parking-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در ایجاد محل پارکینگ');
    }
    return result.data;
  }

  static async updateLocation(id: string, data: Partial<LocationFormData>): Promise<ParkingLocation> {
    const response = await fetch(`/api/parking-locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در به‌روزرسانی محل پارکینگ');
    }
    return result.data;
  }

  static async deleteLocation(id: string): Promise<void> {
    const response = await fetch(`/api/parking-locations/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در حذف محل پارکینگ');
    }
  }
}

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

// Forms
interface LocationFormProps {
  location?: ParkingLocation;
  onSave: (data: LocationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function LocationForm({ location, onSave, onCancel, isLoading }: LocationFormProps) {
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

      <div className="space-y-2">
        <Label htmlFor="address">آدرس</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="آدرس کامل"
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
          {location ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default function ParkingLocationsManagement() {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [editingLocation, setEditingLocation] = useState<ParkingLocation | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load locations
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ParkingLocationsAPI.getLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async (formData: LocationFormData) => {
    try {
      setActionLoading(true);
      setError(null);

      if (editingLocation) {
        // Update existing location
        const updatedLocation = await ParkingLocationsAPI.updateLocation(
          editingLocation.id, 
          formData
        );
        setLocations(locations.map(loc => 
          loc.id === editingLocation.id ? updatedLocation : loc
        ));
      } else {
        // Create new location
        const newLocation = await ParkingLocationsAPI.createLocation(formData);
        setLocations([...locations, newLocation]);
      }
      
      setIsFormDialogOpen(false);
      setEditingLocation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLocation = (location: ParkingLocation) => {
    setEditingLocation(location);
    setIsFormDialogOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("آیا از حذف این محل پارکینگ اطمینان دارید؟")) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await ParkingLocationsAPI.deleteLocation(locationId);
      setLocations(locations.filter(loc => loc.id !== locationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف محل پارکینگ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageCameras = (location: ParkingLocation) => {
    // Navigate to cameras page with location filter
    window.location.href = `/cameras?locationId=${location.id}`;
  };

  const handleManageLots = (location: ParkingLocation) => {
    // Navigate to parking floors page with location filter
    window.location.href = `/parking-floors?locationId=${location.id}`;
  };

  const handleAddNewLocation = () => {
    setEditingLocation(null);
    setIsFormDialogOpen(true);
  };

  // Calculate overall statistics
  const totalStats = locations.reduce((stats, location) => {
    if (!location.isActive) return stats;
    const locationCapacity = location.parkingLots.reduce((sum, lot) => sum + lot.totalCapacity, 0);
    const locationOccupied = location.parkingLots.reduce((sum, lot) => sum + lot.occupiedSpaces, 0);
    return {
      totalLocations: stats.totalLocations + 1,
      totalCapacity: stats.totalCapacity + locationCapacity,
      occupiedSpaces: stats.occupiedSpaces + locationOccupied,
      activeCameras: stats.activeCameras + location.cameras.filter(c => c.isActive).length,
    };
  }, { totalLocations: 0, totalCapacity: 0, occupiedSpaces: 0, activeCameras: 0 });

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
            <h1 className="text-3xl font-bold">مدیریت محل‌های پارکینگ</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date())}
            </p>
          </div>
          <Button onClick={handleAddNewLocation}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن محل جدید
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
                  <p className="text-sm text-gray-600">تعداد محل‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(totalStats.totalLocations)}</p>
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
                <Building className="h-8 w-8 text-green-500" />
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
                <CheckCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">دوربین‌های فعال</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {toPersianNumerals(totalStats.activeCameras)}
                  </p>
                </div>
                <Camera className="h-8 w-8 text-blue-500" />
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
                  <span className="text-gray-600">درصد اشغال کلی:</span>
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

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">هیچ محل پارکینگی تعریف نشده</h3>
              <p className="text-gray-600 mb-4">
                برای شروع، یک محل پارکینگ جدید ایجاد کنید
              </p>
              <Button onClick={handleAddNewLocation}>
                <Plus className="h-4 w-4 ml-2" />
                ایجاد محل پارکینگ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onEdit={handleEditLocation}
                onDelete={handleDeleteLocation}
                onManageCameras={handleManageCameras}
                onManageLots={handleManageLots}
              />
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "ویرایش محل پارکینگ" : "ایجاد محل پارکینگ جدید"}
              </DialogTitle>
            </DialogHeader>
            <LocationForm
              location={editingLocation}
              onSave={handleSaveLocation}
              onCancel={() => {
                setIsFormDialogOpen(false);
                setEditingLocation(null);
              }}
              isLoading={actionLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}