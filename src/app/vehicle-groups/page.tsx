"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Car, 
  Clock, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Settings,
  Calendar,
  Star
} from "lucide-react";

// Simple Persian date formatter
function formatPersianDate(date: Date | string, format: string = "YYYY/MM/DD HH:mm"): string {
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

// Mock data for demonstration
const mockVehicleGroups = [
  {
    id: "1",
    name: "گروه خودروهای عادی",
    description: "خودروهای سواری معمولی",
    vehicleType: "CAR",
    entranceFee: 5000,
    freeMinutes: 15,
    hourlyRate: 3000,
    dailyRate: 25000,
    nightlyRate: 20000,
    dailyCap: 80000,
    nightlyCap: 50000,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  },
  {
    id: "2",
    name: "گروه موتورسیکلت‌ها",
    description: "موتورسیکلت و موتورهای کوچک",
    vehicleType: "MOTORCYCLE",
    entranceFee: 2000,
    freeMinutes: 20,
    hourlyRate: 1500,
    dailyRate: 12000,
    nightlyRate: 10000,
    dailyCap: 40000,
    nightlyCap: 25000,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  },
  {
    id: "3",
    name: "گروه خودروهای ویژه",
    description: "خودروهای لوکس و ویژه",
    vehicleType: "CAR",
    entranceFee: 10000,
    freeMinutes: 10,
    hourlyRate: 5000,
    dailyRate: 40000,
    nightlyRate: 35000,
    dailyCap: 120000,
    nightlyCap: 80000,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  },
  {
    id: "4",
    name: "گروه تعرفه تعطیلات",
    description: "تعرفه ویژه روزهای تعطیل",
    vehicleType: "CAR",
    entranceFee: 7000,
    freeMinutes: 10,
    hourlyRate: 4000,
    dailyRate: 35000,
    nightlyRate: 30000,
    dailyCap: 100000,
    nightlyCap: 70000,
    isActive: true,
    isHolidayRate: true,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  }
];

const vehicleTypes = [
  { value: "CAR", label: "خودرو سواری" },
  { value: "MOTORCYCLE", label: "موتورسیکلت" },
  { value: "TRUCK", label: "کامیون" },
  { value: "BUS", label: "اتوبوس" },
  { value: "VAN", label: "وانت" }
];

interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  vehicleType: string;
  entranceFee: number;
  freeMinutes: number;
  hourlyRate: number;
  dailyRate?: number;
  nightlyRate?: number;
  dailyCap?: number;
  nightlyCap?: number;
  isActive: boolean;
  isHolidayRate: boolean;
  isWeekendRate: boolean;
  validFrom: Date;
  validTo?: Date | null;
}

interface VehicleGroupFormProps {
  group?: VehicleGroup;
  onSave: (group: Partial<VehicleGroup>) => void;
  onCancel: () => void;
}

function VehicleGroupForm({ group, onSave, onCancel }: VehicleGroupFormProps) {
  const [formData, setFormData] = useState<Partial<VehicleGroup>>({
    name: group?.name || "",
    description: group?.description || "",
    vehicleType: group?.vehicleType || "CAR",
    entranceFee: group?.entranceFee || 0,
    freeMinutes: group?.freeMinutes || 15,
    hourlyRate: group?.hourlyRate || 0,
    dailyRate: group?.dailyRate || 0,
    nightlyRate: group?.nightlyRate || 0,
    dailyCap: group?.dailyCap || 0,
    nightlyCap: group?.nightlyCap || 0,
    isActive: group?.isActive ?? true,
    isHolidayRate: group?.isHolidayRate || false,
    isWeekendRate: group?.isWeekendRate || false,
    validFrom: group?.validFrom || new Date(),
    validTo: group?.validTo || null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">نام گروه</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="vehicleType">نوع وسیله نقلیه</Label>
          <Select
            value={formData.vehicleType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">توضیحات</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="entranceFee">ورودیه (تومان)</Label>
          <Input
            id="entranceFee"
            type="number"
            value={formData.entranceFee}
            onChange={(e) => setFormData(prev => ({ ...prev, entranceFee: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="freeMinutes">دقایق رایگان</Label>
          <Input
            id="freeMinutes"
            type="number"
            value={formData.freeMinutes}
            onChange={(e) => setFormData(prev => ({ ...prev, freeMinutes: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="hourlyRate">نرخ ساعتی (تومان)</Label>
          <Input
            id="hourlyRate"
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
            min="0"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dailyRate">نرخ روزانه (تومان)</Label>
          <Input
            id="dailyRate"
            type="number"
            value={formData.dailyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, dailyRate: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="nightlyRate">نرخ شبانه (تومان)</Label>
          <Input
            id="nightlyRate"
            type="number"
            value={formData.nightlyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, nightlyRate: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dailyCap">سقف روزانه (تومان)</Label>
          <Input
            id="dailyCap"
            type="number"
            value={formData.dailyCap}
            onChange={(e) => setFormData(prev => ({ ...prev, dailyCap: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="nightlyCap">سقف شبانه (تومان)</Label>
          <Input
            id="nightlyCap"
            type="number"
            value={formData.nightlyCap}
            onChange={(e) => setFormData(prev => ({ ...prev, nightlyCap: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">فعال</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isHolidayRate"
            checked={formData.isHolidayRate}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHolidayRate: checked }))}
          />
          <Label htmlFor="isHolidayRate">تعرفه تعطیلات</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isWeekendRate"
            checked={formData.isWeekendRate}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isWeekendRate: checked }))}
          />
          <Label htmlFor="isWeekendRate">تعرفه آخر هفته</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 ml-2" />
          انصراف
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 ml-2" />
          ذخیره
        </Button>
      </div>
    </form>
  );
}

export default function VehicleGroupsPage() {
  const [groups, setGroups] = useState<VehicleGroup[]>(mockVehicleGroups);
  const [editingGroup, setEditingGroup] = useState<VehicleGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSaveGroup = (groupData: Partial<VehicleGroup>) => {
    try {
      if (editingGroup) {
        // Update existing group
        setGroups(prev => prev.map(g => 
          g.id === editingGroup.id ? { ...g, ...groupData } as VehicleGroup : g
        ));
        setAlert({ type: 'success', message: 'گروه با موفقیت به‌روزرسانی شد' });
      } else {
        // Create new group
        const newGroup: VehicleGroup = {
          id: Date.now().toString(),
          ...groupData,
        } as VehicleGroup;
        setGroups(prev => [...prev, newGroup]);
        setAlert({ type: 'success', message: 'گروه جدید با موفقیت ایجاد شد' });
      }
      setIsDialogOpen(false);
      setEditingGroup(null);
    } catch (error) {
      setAlert({ type: 'error', message: 'خطا در ذخیره گروه' });
    }
  };

  const handleEditGroup = (group: VehicleGroup) => {
    setEditingGroup(group);
    setIsDialogOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('آیا از حذف این گروه اطمینان دارید؟')) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setAlert({ type: 'success', message: 'گروه با موفقیت حذف شد' });
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsDialogOpen(true);
  };

  const getVehicleTypeLabel = (type: string) => {
    return vehicleTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت گروه‌های وسیله نقلیه</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <Button onClick={handleAddGroup}>
            <Plus className="h-4 w-4 ml-2" />
            گروه جدید
          </Button>
        </div>

        {/* Alert */}
        {alert && (
          <Alert className={alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {alert.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Car className="h-5 w-5 ml-2" />
                    {group.name}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                  {group.isHolidayRate && (
                    <Badge variant="outline">
                      <Star className="h-3 w-3 ml-1" />
                      تعطیلات
                    </Badge>
                  )}
                  {group.isWeekendRate && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 ml-1" />
                      آخر هفته
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">نوع وسیله نقلیه:</span>
                    <span className="text-sm font-medium">{getVehicleTypeLabel(group.vehicleType)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ورودیه:</span>
                    <span className="text-sm font-medium">{toPersianNumerals(group.entranceFee.toLocaleString())} تومان</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">دقایق رایگان:</span>
                    <span className="text-sm font-medium">{toPersianNumerals(group.freeMinutes)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">نرخ ساعتی:</span>
                    <span className="text-sm font-medium">{toPersianNumerals(group.hourlyRate.toLocaleString())} تومان</span>
                  </div>
                  {group.dailyRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">نرخ روزانه:</span>
                      <span className="text-sm font-medium">{toPersianNumerals(group.dailyRate.toLocaleString())} تومان</span>
                    </div>
                  )}
                  {group.nightlyRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">نرخ شبانه:</span>
                      <span className="text-sm font-medium">{toPersianNumerals(group.nightlyRate.toLocaleString())} تومان</span>
                    </div>
                  )}
                  {group.dailyCap && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">سقف روزانه:</span>
                      <span className="text-sm font-medium">{toPersianNumerals(group.dailyCap.toLocaleString())} تومان</span>
                    </div>
                  )}
                  {group.nightlyCap && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">سقف شبانه:</span>
                      <span className="text-sm font-medium">{toPersianNumerals(group.nightlyCap.toLocaleString())} تومان</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 border-t pt-2">
                  <div>از: {formatPersianDate(group.validFrom)}</div>
                  {group.validTo && (
                    <div>تا: {formatPersianDate(group.validTo)}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "ویرایش گروه" : "گروه جدید"}
              </DialogTitle>
            </DialogHeader>
            <VehicleGroupForm
              group={editingGroup || undefined}
              onSave={handleSaveGroup}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}