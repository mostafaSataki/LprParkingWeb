"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { PersianNumeralsInput } from "@/components/ui/persian-date-picker";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  Clock,
  DollarSign,
  Car,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

// Mock data for demonstration
const mockTariffs = [
  {
    id: "1",
    name: "تعرفه عادی خودرو",
    description: "تعرفه استاندارد برای خودروهای شخصی",
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
    name: "تعرفه موتورسیکلت",
    description: "تعرفه ویژه موتورسیکلت‌ها",
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
    name: "تعرفه تعطیلات رسمی",
    description: "تعرفه ویژه ایام تعطیل رسمی",
    vehicleType: "CAR",
    entranceFee: 5000,
    freeMinutes: 15,
    hourlyRate: 4500,
    dailyRate: 35000,
    nightlyRate: 30000,
    dailyCap: 120000,
    nightlyCap: 80000,
    isActive: true,
    isHolidayRate: true,
    isWeekendRate: false,
    validFrom: new Date("2024-01-01"),
    validTo: null
  }
];

const mockHolidays = [
  {
    id: "1",
    name: "نوروز",
    date: new Date("2024-03-21"),
    isRecurring: true,
    type: "OFFICIAL",
    description: "عید نوروز",
    isActive: true
  },
  {
    id: "2",
    name: "روز جمهوری اسلامی",
    date: new Date("2024-04-01"),
    isRecurring: true,
    type: "OFFICIAL",
    description: "۱۲ فروردین",
    isActive: true
  },
  {
    id: "3",
    name: "روز قدس",
    date: new Date("2024-04-05"),
    isRecurring: true,
    type: "RELIGIOUS",
    description: "آخرین جمعه ماه رمضان",
    isActive: true
  }
];

interface TariffFormData {
  name: string;
  description: string;
  vehicleType: string;
  entranceFee: number;
  freeMinutes: number;
  hourlyRate: number;
  dailyRate?: number;
  nightlyRate?: number;
  dailyCap?: number;
  nightlyCap?: number;
  weeklyCap?: number;
  monthlyCap?: number;
  isActive: boolean;
  isHolidayRate: boolean;
  isWeekendRate: boolean;
  validFrom: Date;
  validTo?: Date;
}

interface HolidayFormData {
  name: string;
  date: Date;
  isRecurring: boolean;
  type: string;
  description: string;
  isActive: boolean;
}

export default function TariffManagement() {
  const [tariffs, setTariffs] = useState(mockTariffs);
  const [holidays, setHolidays] = useState(mockHolidays);
  const [editingTariff, setEditingTariff] = useState<string | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<string | null>(null);
  const [showTariffForm, setShowTariffForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [tariffForm, setTariffForm] = useState<TariffFormData>({
    name: "",
    description: "",
    vehicleType: "CAR",
    entranceFee: 0,
    freeMinutes: 15,
    hourlyRate: 0,
    dailyRate: undefined,
    nightlyRate: undefined,
    dailyCap: undefined,
    nightlyCap: undefined,
    weeklyCap: undefined,
    monthlyCap: undefined,
    isActive: true,
    isHolidayRate: false,
    isWeekendRate: false,
    validFrom: new Date(),
    validTo: undefined
  });
  const [holidayForm, setHolidayForm] = useState<HolidayFormData>({
    name: "",
    date: new Date(),
    isRecurring: true,
    type: "OFFICIAL",
    description: "",
    isActive: true
  });

  const handleTariffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the database
    console.log("Saving tariff:", tariffForm);
    setShowTariffForm(false);
    setEditingTariff(null);
    // Reset form
    setTariffForm({
      name: "",
      description: "",
      vehicleType: "CAR",
      entranceFee: 0,
      freeMinutes: 15,
      hourlyRate: 0,
      dailyRate: undefined,
      nightlyRate: undefined,
      dailyCap: undefined,
      nightlyCap: undefined,
      weeklyCap: undefined,
      monthlyCap: undefined,
      isActive: true,
      isHolidayRate: false,
      isWeekendRate: false,
      validFrom: new Date(),
      validTo: undefined
    });
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the database
    console.log("Saving holiday:", holidayForm);
    setShowHolidayForm(false);
    setEditingHoliday(null);
    // Reset form
    setHolidayForm({
      name: "",
      date: new Date(),
      isRecurring: true,
      type: "OFFICIAL",
      description: "",
      isActive: true
    });
  };

  const editTariff = (tariff: any) => {
    setTariffForm(tariff);
    setEditingTariff(tariff.id);
    setShowTariffForm(true);
  };

  const editHoliday = (holiday: any) => {
    setHolidayForm(holiday);
    setEditingHoliday(holiday.id);
    setShowHolidayForm(true);
  };

  const deleteTariff = (id: string) => {
    setTariffs(tariffs.filter(t => t.id !== id));
  };

  const deleteHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CAR: "خودرو",
      MOTORCYCLE: "موتورسیکلت",
      TRUCK: "کامیون",
      BUS: "اتوبوس",
      VAN: "وانت"
    };
    return labels[type] || type;
  };

  const getHolidayTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      OFFICIAL: "رسمی",
      RELIGIOUS: "مذهبی",
      CUSTOM: "سفارشی"
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت تعرفه‌ها</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 ml-2" />
              تنظیمات سیستم
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tariffs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tariffs">تعرفه‌ها</TabsTrigger>
            <TabsTrigger value="holidays">تعطیلات</TabsTrigger>
          </TabsList>

          {/* Tariffs Tab */}
          <TabsContent value="tariffs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">تعرفه‌های پارکینگ</h2>
              <Button onClick={() => setShowTariffForm(true)}>
                <Plus className="h-4 w-4 ml-2" />
                تعرفه جدید
              </Button>
            </div>

            {/* Tariff Form */}
            {showTariffForm && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {editingTariff ? "ویرایش تعرفه" : "تعرفه جدید"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowTariffForm(false);
                        setEditingTariff(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTariffSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">نام تعرفه</Label>
                        <Input
                          id="name"
                          value={tariffForm.name}
                          onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">نوع وسیله نقلیه</Label>
                        <Select
                          value={tariffForm.vehicleType}
                          onValueChange={(value) => setTariffForm({ ...tariffForm, vehicleType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CAR">خودرو</SelectItem>
                            <SelectItem value="MOTORCYCLE">موتورسیکلت</SelectItem>
                            <SelectItem value="TRUCK">کامیون</SelectItem>
                            <SelectItem value="BUS">اتوبوس</SelectItem>
                            <SelectItem value="VAN">وانت</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">توضیحات</Label>
                      <Textarea
                        id="description"
                        value={tariffForm.description}
                        onChange={(e) => setTariffForm({ ...tariffForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entranceFee">حق ورودی (تومان)</Label>
                        <PersianNumeralsInput
                          id="entranceFee"
                          value={tariffForm.entranceFee}
                          onChange={(value) => setTariffForm({ ...tariffForm, entranceFee: Number(value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freeMinutes">دقایق رایگان</Label>
                        <PersianNumeralsInput
                          id="freeMinutes"
                          value={tariffForm.freeMinutes}
                          onChange={(value) => setTariffForm({ ...tariffForm, freeMinutes: Number(value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">نرخ ساعتی (تومان)</Label>
                        <PersianNumeralsInput
                          id="hourlyRate"
                          value={tariffForm.hourlyRate}
                          onChange={(value) => setTariffForm({ ...tariffForm, hourlyRate: Number(value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyRate">نرخ روزانه (تومان)</Label>
                        <PersianNumeralsInput
                          id="dailyRate"
                          value={tariffForm.dailyRate || ""}
                          onChange={(value) => setTariffForm({ ...tariffForm, dailyRate: value ? Number(value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nightlyRate">نرخ شبانه (تومان)</Label>
                        <PersianNumeralsInput
                          id="nightlyRate"
                          value={tariffForm.nightlyRate || ""}
                          onChange={(value) => setTariffForm({ ...tariffForm, nightlyRate: value ? Number(value) : undefined })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyCap">سقف روزانه (تومان)</Label>
                        <PersianNumeralsInput
                          id="dailyCap"
                          value={tariffForm.dailyCap || ""}
                          onChange={(value) => setTariffForm({ ...tariffForm, dailyCap: value ? Number(value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nightlyCap">سقف شبانه (تومان)</Label>
                        <PersianNumeralsInput
                          id="nightlyCap"
                          value={tariffForm.nightlyCap || ""}
                          onChange={(value) => setTariffForm({ ...tariffForm, nightlyCap: value ? Number(value) : undefined })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>تاریخ شروع اعتبار</Label>
                        <PersianDatePicker
                          value={tariffForm.validFrom}
                          onChange={(date) => setTariffForm({ ...tariffForm, validFrom: date || new Date() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>تاریخ پایان اعتبار</Label>
                        <PersianDatePicker
                          value={tariffForm.validTo}
                          onChange={(date) => setTariffForm({ ...tariffForm, validTo: date })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={tariffForm.isActive}
                          onCheckedChange={(checked) => setTariffForm({ ...tariffForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">فعال</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isHolidayRate"
                          checked={tariffForm.isHolidayRate}
                          onCheckedChange={(checked) => setTariffForm({ ...tariffForm, isHolidayRate: checked })}
                        />
                        <Label htmlFor="isHolidayRate">تعرفه تعطیلات</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isWeekendRate"
                          checked={tariffForm.isWeekendRate}
                          onCheckedChange={(checked) => setTariffForm({ ...tariffForm, isWeekendRate: checked })}
                        />
                        <Label htmlFor="isWeekendRate">تعرفه آخر هفته</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowTariffForm(false)}>
                        انصراف
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 ml-2" />
                        ذخیره
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Tariffs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tariffs.map((tariff) => (
                <Card key={tariff.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tariff.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={tariff.isActive ? "default" : "secondary"}>
                          {tariff.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                        {tariff.isHolidayRate && (
                          <Badge variant="outline">تعطیلات</Badge>
                        )}
                        {tariff.isWeekendRate && (
                          <Badge variant="outline">آخر هفته</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4" />
                      <span>{getVehicleTypeLabel(tariff.vehicleType)}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>حق ورودی:</span>
                        <span className="font-semibold">{toPersianNumerals(tariff.entranceFee.toLocaleString())} تومان</span>
                      </div>
                      <div className="flex justify-between">
                        <span>دقایق رایگان:</span>
                        <span className="font-semibold">{toPersianNumerals(tariff.freeMinutes)} دقیقه</span>
                      </div>
                      <div className="flex justify-between">
                        <span>نرخ ساعتی:</span>
                        <span className="font-semibold">{toPersianNumerals(tariff.hourlyRate.toLocaleString())} تومان</span>
                      </div>
                      {tariff.dailyRate && (
                        <div className="flex justify-between">
                          <span>نرخ روزانه:</span>
                          <span className="font-semibold">{toPersianNumerals(tariff.dailyRate.toLocaleString())} تومان</span>
                        </div>
                      )}
                      {tariff.nightlyRate && (
                        <div className="flex justify-between">
                          <span>نرخ شبانه:</span>
                          <span className="font-semibold">{toPersianNumerals(tariff.nightlyRate.toLocaleString())} تومان</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-600">
                      <div>از: {formatPersianDate(tariff.validFrom, "YYYY/MM/DD")}</div>
                      {tariff.validTo && (
                        <div>تا: {formatPersianDate(tariff.validTo, "YYYY/MM/DD")}</div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editTariff(tariff)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTariff(tariff.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">تعطیلات رسمی</h2>
              <Button onClick={() => setShowHolidayForm(true)}>
                <Plus className="h-4 w-4 ml-2" />
                تعطیل جدید
              </Button>
            </div>

            {/* Holiday Form */}
            {showHolidayForm && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {editingHoliday ? "ویرایش تعطیل" : "تعطیل جدید"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowHolidayForm(false);
                        setEditingHoliday(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleHolidaySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="holidayName">نام تعطیل</Label>
                        <Input
                          id="holidayName"
                          value={holidayForm.name}
                          onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="holidayType">نوع تعطیل</Label>
                        <Select
                          value={holidayForm.type}
                          onValueChange={(value) => setHolidayForm({ ...holidayForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OFFICIAL">رسمی</SelectItem>
                            <SelectItem value="RELIGIOUS">مذهبی</SelectItem>
                            <SelectItem value="CUSTOM">سفارشی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="holidayDate">تاریخ</Label>
                      <PersianDatePicker
                        value={holidayForm.date}
                        onChange={(date) => setHolidayForm({ ...holidayForm, date: date || new Date() })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="holidayDescription">توضیحات</Label>
                      <Textarea
                        id="holidayDescription"
                        value={holidayForm.description}
                        onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isRecurring"
                          checked={holidayForm.isRecurring}
                          onCheckedChange={(checked) => setHolidayForm({ ...holidayForm, isRecurring: checked })}
                        />
                        <Label htmlFor="isRecurring">تکرار سالانه</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={holidayForm.isActive}
                          onCheckedChange={(checked) => setHolidayForm({ ...holidayForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">فعال</Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowHolidayForm(false)}>
                        انصراف
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 ml-2" />
                        ذخیره
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Holidays List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((holiday) => (
                <Card key={holiday.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{holiday.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={holiday.isActive ? "default" : "secondary"}>
                          {holiday.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                        <Badge variant="outline">{getHolidayTypeLabel(holiday.type)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatPersianDate(holiday.date, "YYYY/MM/DD")}</span>
                    </div>
                    
                    {holiday.description && (
                      <p className="text-sm text-gray-600">{holiday.description}</p>
                    )}

                    {holiday.isRecurring && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>تکرار سالانه</span>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editHoliday(holiday)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteHoliday(holiday.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}