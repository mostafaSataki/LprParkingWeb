"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RTLDialogWrapper } from "@/components/rtl-dialog-wrapper";
import { RTLDialogContent } from "@/components/rtl-dialog-content";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Users, 
  Car, 
  MapPin, 
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Filter,
  Download,
  Loader2,
  Settings
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

function formatTime(time: string): string {
  if (!time) return "";
  return time.slice(0, 5); // HH:mm format
}

// Types
interface ParkingContract {
  id: string;
  customerId: string;
  vehicleId?: string;
  locationId: string;
  name: string;
  description?: string;
  contractType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  startDate: Date;
  endDate?: Date;
  validFrom: Date;
  validTo?: Date;
  dailyEntranceLimit: number;
  weeklyEntranceLimit?: number;
  monthlyEntranceLimit?: number;
  totalEntranceLimit?: number;
  mondayAllowed: boolean;
  tuesdayAllowed: boolean;
  wednesdayAllowed: boolean;
  thursdayAllowed: boolean;
  fridayAllowed: boolean;
  saturdayAllowed: boolean;
  sundayAllowed: boolean;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  autoRenew: boolean;
  tariffId?: string;
  fixedMonthlyFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  customer: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  vehicle?: {
    plateNumber: string;
    vehicleType: string;
    ownerName: string;
  };
  location: {
    id: string;
    name: string;
    address: string;
  };
  tariff?: {
    id: string;
    name: string;
    hourlyRate: number;
    dailyRate: number;
  };
  usages: ContractUsage[];
  _count: {
    usages: number;
  };
}

interface ContractUsage {
  id: string;
  contractId: string;
  sessionId?: string;
  entranceDate: Date;
  entranceTime: string;
  exitDate?: Date;
  exitTime?: string;
  isValid: boolean;
  violationReason?: string;
  notes?: string;
  createdAt: Date;
}

interface ParkingLocation {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Vehicle {
  plateNumber: string;
  vehicleType: string;
  ownerName: string;
}

interface ContractFormData {
  customerId: string;
  vehicleId?: string;
  locationId: string;
  name: string;
  description?: string;
  contractType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  startDate: string;
  endDate?: string;
  validFrom?: string;
  validTo?: string;
  dailyEntranceLimit: number;
  weeklyEntranceLimit?: number;
  monthlyEntranceLimit?: number;
  totalEntranceLimit?: number;
  mondayAllowed: boolean;
  tuesdayAllowed: boolean;
  wednesdayAllowed: boolean;
  thursdayAllowed: boolean;
  fridayAllowed: boolean;
  saturdayAllowed: boolean;
  sundayAllowed: boolean;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  autoRenew: boolean;
  tariffId?: string;
  fixedMonthlyFee?: number;
  notes?: string;
}

// API Service
class ContractsAPI {
  static async getContracts(filters?: any): Promise<ParkingContract[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`/api/contracts?${params.toString()}`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست قراردادها');
    }
    return result.data;
  }

  static async createContract(data: ContractFormData): Promise<ParkingContract> {
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در ایجاد قرارداد');
    }
    return result.data;
  }

  static async updateContract(id: string, data: Partial<ContractFormData>): Promise<ParkingContract> {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در به‌روزرسانی قرارداد');
    }
    return result.data;
  }

  static async deleteContract(id: string): Promise<void> {
    const response = await fetch(`/api/contracts/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در حذف قرارداد');
    }
  }

  static async getContract(id: string): Promise<any> {
    const response = await fetch(`/api/contracts/${id}`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت اطلاعات قرارداد');
    }
    return result.data;
  }

  static async getLocations(): Promise<ParkingLocation[]> {
    const response = await fetch('/api/parking-locations');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست محل‌ها');
    }
    return result.data;
  }

  static async getCustomers(): Promise<User[]> {
    const response = await fetch('/api/users');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست مشتریان');
    }
    return result.data;
  }

  static async getVehicles(): Promise<Vehicle[]> {
    const response = await fetch('/api/vehicles');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت لیست خودروها');
    }
    return result.data;
  }

  static async recordUsage(contractId: string, data: any): Promise<any> {
    const response = await fetch(`/api/contracts/${contractId}/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در ثبت استفاده');
    }
    return result.data;
  }

  static async getReports(filters: any): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`/api/contracts/reports?${params.toString()}`);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'خطا در دریافت گزارش');
    }
    return result.data;
  }
}

// Components
interface ContractCardProps {
  contract: ParkingContract;
  onEdit: (contract: ParkingContract) => void;
  onDelete: (contractId: string) => void;
  onViewDetails: (contract: ParkingContract) => void;
  onRecordUsage: (contract: ParkingContract) => void;
}

function ContractCard({ contract, onEdit, onDelete, onViewDetails, onRecordUsage }: ContractCardProps) {
  const getContractTypeLabel = (type: string) => {
    const labels = {
      'HOURLY': 'ساعتی',
      'DAILY': 'روزانه',
      'WEEKLY': 'هفتگی',
      'MONTHLY': 'ماهانه',
      'QUARTERLY': 'فصلی',
      'YEARLY': 'سالانه',
      'CUSTOM': 'سفارشی'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const validUsages = contract.usages.filter(u => u.isValid).length;
  const invalidUsages = contract.usages.filter(u => !u.isValid).length;
  const totalUsages = contract.usages.length;

  const isExpired = contract.endDate && new Date(contract.endDate) < new Date();
  const isActive = contract.isActive && !isExpired;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            {contract.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "فعال" : "غیرفعال"}
            </Badge>
            {isExpired && <Badge variant="destructive">منقضی</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer and Location */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{contract.customer.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{contract.location.name}</span>
          </div>
          {contract.vehicle && (
            <div className="flex items-center gap-2 text-gray-600">
              <Car className="h-4 w-4" />
              <span>{contract.vehicle.plateNumber}</span>
            </div>
          )}
        </div>

        {/* Contract Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">نوع:</span>
            <p className="font-medium">{getContractTypeLabel(contract.contractType)}</p>
          </div>
          <div>
            <span className="text-gray-600">محدودیت روزانه:</span>
            <p className="font-medium">{toPersianNumerals(contract.dailyEntranceLimit)}</p>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">
              {toPersianNumerals(totalUsages)}
            </div>
            <div className="text-xs text-gray-600">کل استفاده</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">
              {toPersianNumerals(validUsages)}
            </div>
            <div className="text-xs text-gray-600">مجاز</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-600">
              {toPersianNumerals(invalidUsages)}
            </div>
            <div className="text-xs text-gray-600">نامجاز</div>
          </div>
        </div>

        {/* Time Restrictions */}
        {(contract.startTime || contract.endTime) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {contract.startTime || "۰۰:۰۰"} - {contract.endTime || "۲۴:۰۰"}
            </span>
          </div>
        )}

        {/* Validity Period */}
        <div className="text-xs text-gray-500">
          <div>از: {formatPersianDate(contract.validFrom)}</div>
          {contract.validTo && (
            <div>تا: {formatPersianDate(contract.validTo)}</div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails(contract)}
            >
              <BarChart3 className="h-4 w-4 ml-1" />
              جزئیات
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onRecordUsage(contract)}
              disabled={!isActive}
            >
              <Plus className="h-4 w-4 ml-1" />
              ثبت ورود
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(contract)}
            >
              <Edit className="h-4 w-4 ml-1" />
              ویرایش
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onDelete(contract.id)}
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

interface ContractFormProps {
  contract?: ParkingContract;
  locations: ParkingLocation[];
  customers: User[];
  vehicles: Vehicle[];
  onSave: (data: ContractFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ContractForm({ contract, locations, customers, vehicles, onSave, onCancel, isLoading }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    customerId: contract?.customerId || "",
    vehicleId: contract?.vehicleId || "none",
    locationId: contract?.locationId || "",
    name: contract?.name || "",
    description: contract?.description || "",
    contractType: contract?.contractType || "MONTHLY",
    startDate: contract?.startDate ? contract.startDate.toISOString().split('T')[0] : "",
    endDate: contract?.endDate ? contract.endDate.toISOString().split('T')[0] : "",
    validFrom: contract?.validFrom ? contract.validFrom.toISOString().split('T')[0] : "",
    validTo: contract?.validTo ? contract.validTo.toISOString().split('T')[0] : "",
    dailyEntranceLimit: contract?.dailyEntranceLimit || 1,
    weeklyEntranceLimit: contract?.weeklyEntranceLimit,
    monthlyEntranceLimit: contract?.monthlyEntranceLimit,
    totalEntranceLimit: contract?.totalEntranceLimit,
    mondayAllowed: contract?.mondayAllowed ?? true,
    tuesdayAllowed: contract?.tuesdayAllowed ?? true,
    wednesdayAllowed: contract?.wednesdayAllowed ?? true,
    thursdayAllowed: contract?.thursdayAllowed ?? true,
    fridayAllowed: contract?.fridayAllowed ?? true,
    saturdayAllowed: contract?.saturdayAllowed ?? true,
    sundayAllowed: contract?.sundayAllowed ?? true,
    startTime: contract?.startTime || "",
    endTime: contract?.endTime || "",
    isActive: contract?.isActive ?? true,
    autoRenew: contract?.autoRenew ?? false,
    tariffId: contract?.tariffId,
    fixedMonthlyFee: contract?.fixedMonthlyFee,
    notes: contract?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for API - convert "none" to undefined for vehicleId
    const apiData = { ...formData };
    if (apiData.vehicleId === "none") {
      apiData.vehicleId = undefined;
    }
    
    onSave(apiData);
  };

  const getContractTypeLabel = (type: string) => {
    const labels = {
      'HOURLY': 'ساعتی',
      'DAILY': 'روزانه',
      'WEEKLY': 'هفتگی',
      'MONTHLY': 'ماهانه',
      'QUARTERLY': 'فصلی',
      'YEARLY': 'سالانه',
      'CUSTOM': 'سفارشی'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
          <TabsTrigger value="restrictions">محدودیت‌ها</TabsTrigger>
          <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">مشتری</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="مشتری را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">محل پارکینگ</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                disabled={isLoading}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">نام قرارداد</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: قرارداد ماهانه پارکینگ مرکزی"
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
              <Label htmlFor="contractType">نوع قرارداد</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) => setFormData({ ...formData, contractType: value as any })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries({
                    'HOURLY': 'ساعتی',
                    'DAILY': 'روزانه',
                    'WEEKLY': 'هفتگی',
                    'MONTHLY': 'ماهانه',
                    'QUARTERLY': 'فصلی',
                    'YEARLY': 'سالانه',
                    'CUSTOM': 'سفارشی'
                  }).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleId">خودرو (اختیاری)</Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="خودرو را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون محدودیت خودرو</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.plateNumber} value={vehicle.plateNumber}>
                      {vehicle.plateNumber} - {vehicle.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">تاریخ شروع</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">تاریخ پایان</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="restrictions" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyEntranceLimit">محدودیت ورود روزانه</Label>
              <Input
                id="dailyEntranceLimit"
                type="number"
                min="1"
                value={formData.dailyEntranceLimit}
                onChange={(e) => setFormData({ ...formData, dailyEntranceLimit: parseInt(e.target.value) || 1 })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyEntranceLimit">محدودیت ورود هفتگی</Label>
              <Input
                id="weeklyEntranceLimit"
                type="number"
                min="1"
                value={formData.weeklyEntranceLimit || ""}
                onChange={(e) => setFormData({ ...formData, weeklyEntranceLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyEntranceLimit">محدودیت ورود ماهانه</Label>
              <Input
                id="monthlyEntranceLimit"
                type="number"
                min="1"
                value={formData.monthlyEntranceLimit || ""}
                onChange={(e) => setFormData({ ...formData, monthlyEntranceLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalEntranceLimit">محدودیت ورود کل</Label>
              <Input
                id="totalEntranceLimit"
                type="number"
                min="1"
                value={formData.totalEntranceLimit || ""}
                onChange={(e) => setFormData({ ...formData, totalEntranceLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>محدودیت زمانی</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm">از ساعت</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="۰۰:۰۰"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm">تا ساعت</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="۲۴:۰۰"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>روزهای مجاز</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'saturdayAllowed', label: 'شنبه' },
                { key: 'sundayAllowed', label: 'یکشنبه' },
                { key: 'mondayAllowed', label: 'دوشنبه' },
                { key: 'tuesdayAllowed', label: 'سه‌شنبه' },
                { key: 'wednesdayAllowed', label: 'چهارشنبه' },
                { key: 'thursdayAllowed', label: 'پنج‌شنبه' },
                { key: 'fridayAllowed', label: 'جمعه' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="rounded"
                    disabled={isLoading}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">تاریخ اعتبار از</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validTo">تاریخ اعتبار تا</Label>
              <Input
                id="validTo"
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fixedMonthlyFee">هزینه ماهانه ثابت</Label>
            <Input
              id="fixedMonthlyFee"
              type="number"
              min="0"
              step="1000"
              value={formData.fixedMonthlyFee || ""}
              onChange={(e) => setFormData({ ...formData, fixedMonthlyFee: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="برای استفاده رایگان خالی بگذارید"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">یادداشت‌ها</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="یادداشت‌های اختیاری"
              className="w-full p-2 border rounded-md"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="rounded"
                disabled={isLoading}
              />
              <Label htmlFor="autoRenew">تمدید خودکار</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
          {contract ? "به‌روزرسانی" : "ایجاد"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default function ContractsManagement() {
  const [contracts, setContracts] = useState<ParkingContract[]>([]);
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingContract, setEditingContract] = useState<ParkingContract | null>(null);
  const [selectedContract, setSelectedContract] = useState<ParkingContract | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    locationId: 'all',
    customerId: 'all',
    isActive: 'all',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [contractsData, locationsData, customersData, vehiclesData] = await Promise.all([
        ContractsAPI.getContracts(),
        ContractsAPI.getLocations(),
        ContractsAPI.getCustomers(),
        ContractsAPI.getVehicles()
      ]);
      
      setContracts(contractsData);
      setLocations(locationsData);
      setCustomers(customersData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (formData: ContractFormData) => {
    try {
      setActionLoading(true);
      setError(null);

      if (editingContract) {
        // Update existing contract
        const updatedContract = await ContractsAPI.updateContract(
          editingContract.id, 
          formData
        );
        setContracts(contracts.map(contract => 
          contract.id === editingContract.id ? updatedContract : contract
        ));
      } else {
        // Create new contract
        const newContract = await ContractsAPI.createContract(formData);
        setContracts([...contracts, newContract]);
      }
      
      setIsFormDialogOpen(false);
      setEditingContract(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditContract = (contract: ParkingContract) => {
    setEditingContract(contract);
    setIsFormDialogOpen(true);
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("آیا از حذف این قرارداد اطمینان دارید؟")) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await ContractsAPI.deleteContract(contractId);
      setContracts(contracts.filter(contract => contract.id !== contractId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف قرارداد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (contract: ParkingContract) => {
    setSelectedContract(contract);
    setIsDetailsDialogOpen(true);
  };

  const handleRecordUsage = async (contract: ParkingContract) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const plateNumber = prompt('لطفاً پلاک خودرو را وارد کنید:');
      if (!plateNumber) return;

      const usage = await ContractsAPI.recordUsage(contract.id, {
        plateNumber,
        entranceTime: new Date().toTimeString().slice(0, 8),
      });

      if (usage.isValid) {
        alert('ورود با موفقیت ثبت شد');
      } else {
        alert(`ورود نامجاز: ${usage.violationReason}`);
      }

      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت استفاده');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNewContract = () => {
    setEditingContract(null);
    setIsFormDialogOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getFilteredContracts = () => {
    return contracts.filter(contract => {
      if (filters.locationId !== "all" && contract.locationId !== filters.locationId) return false;
      if (filters.customerId !== "all" && contract.customerId !== filters.customerId) return false;
      if (filters.isActive !== "all" && contract.isActive.toString() !== filters.isActive) return false;
      return true;
    });
  };

  // Calculate statistics
  const filteredContracts = getFilteredContracts();
  const totalContracts = filteredContracts.length;
  const activeContracts = filteredContracts.filter(c => c.isActive).length;
  const totalUsages = filteredContracts.reduce((sum, c) => sum + c.usages.length, 0);
  const validUsages = filteredContracts.reduce((sum, c) => sum + c.usages.filter(u => u.isValid).length, 0);

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
            <h1 className="text-3xl font-bold">مدیریت قراردادهای پارکینگ</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date())}
            </p>
          </div>
          <Button onClick={handleAddNewContract}>
            <Plus className="h-4 w-4 ml-2" />
            ایجاد قرارداد جدید
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تعداد قراردادها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(totalContracts)}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">قراردادهای فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(activeContracts)}
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
                  <p className="text-sm text-gray-600">کل استفاده‌ها</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {toPersianNumerals(totalUsages)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">استفاده‌های مجاز</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {toPersianNumerals(validUsages)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">فیلترها</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="locationFilter">محل پارکینگ</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) => handleFilterChange('locationId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه محل‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه محل‌ها</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customerFilter">مشتری</Label>
                <Select
                  value={filters.customerId}
                  onValueChange={(value) => handleFilterChange('customerId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه مشتریان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه مشتریان</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statusFilter">وضعیت</Label>
                <Select
                  value={filters.isActive}
                  onValueChange={(value) => handleFilterChange('isActive', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="true">فعال</SelectItem>
                    <SelectItem value="false">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">هیچ قراردادی یافت نشد</h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some(v => v) 
                  ? 'هیچ قراردادی با فیلترهای انتخاب شده یافت نشد'
                  : 'برای شروع، یک قرارداد جدید ایجاد کنید'
                }
              </p>
              <Button onClick={handleAddNewContract}>
                <Plus className="h-4 w-4 ml-2" />
                ایجاد قرارداد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onEdit={handleEditContract}
                onDelete={handleDeleteContract}
                onViewDetails={handleViewDetails}
                onRecordUsage={handleRecordUsage}
              />
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <RTLDialogContent className="sm:max-w-6xl max-h-[95vh]">
            <RTLDialogWrapper>
              <DialogHeader>
              <DialogTitle>
                {editingContract ? "ویرایش قرارداد" : "ایجاد قرارداد جدید"}
              </DialogTitle>
            </DialogHeader>
            <ContractForm
              contract={editingContract}
              locations={locations}
              customers={customers}
              vehicles={vehicles}
              onSave={handleSaveContract}
              onCancel={() => {
                setIsFormDialogOpen(false);
                setEditingContract(null);
              }}
              isLoading={actionLoading}
            />
          </RTLDialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <RTLDialogWrapper>
              <DialogHeader>
                <DialogTitle>جزئیات قرارداد</DialogTitle>
              </DialogHeader>
            {selectedContract && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">اطلاعات پایه</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">نام:</span> {selectedContract.name}</p>
                      <p><span className="text-gray-600">مشتری:</span> {selectedContract.customer.name}</p>
                      <p><span className="text-gray-600">محل:</span> {selectedContract.location.name}</p>
                      {selectedContract.vehicle && (
                        <p><span className="text-gray-600">خودرو:</span> {selectedContract.vehicle.plateNumber}</p>
                      )}
                      <p><span className="text-gray-600">نوع:</span> {selectedContract.contractType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">محدودیت‌ها</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">روزانه:</span> {toPersianNumerals(selectedContract.dailyEntranceLimit)}</p>
                      {selectedContract.weeklyEntranceLimit && (
                        <p><span className="text-gray-600">هفتگی:</span> {toPersianNumerals(selectedContract.weeklyEntranceLimit)}</p>
                      )}
                      {selectedContract.monthlyEntranceLimit && (
                        <p><span className="text-gray-600">ماهانه:</span> {toPersianNumerals(selectedContract.monthlyEntranceLimit)}</p>
                      )}
                      {selectedContract.totalEntranceLimit && (
                        <p><span className="text-gray-600">کل:</span> {toPersianNumerals(selectedContract.totalEntranceLimit)}</p>
                      )}
                      {(selectedContract.startTime || selectedContract.endTime) && (
                        <p><span className="text-gray-600">زمان:</span> {selectedContract.startTime || '۰۰:۰۰'} - {selectedContract.endTime || '۲۴:۰۰'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">آخرین استفاده‌ها</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedContract.usages.slice(0, 10).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {usage.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {formatPersianDate(usage.entranceDate)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {usage.entranceTime}
                        </div>
                      </div>
                    ))}
                    {selectedContract.usages.length === 0 && (
                      <p className="text-gray-500 text-sm">هیچ استفاده‌ای ثبت نشده است</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            </RTLDialogWrapper>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}