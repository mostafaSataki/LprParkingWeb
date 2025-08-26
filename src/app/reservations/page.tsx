"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Car, 
  Clock, 
  CreditCard, 
  User,
  Phone,
  Mail,
  ParkingCircle,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import ReservationPaymentProcessor from "@/components/reservation-payment-processor";

// Persian date formatter
function formatPersianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
}

function toPersianNumerals(num: number | string): string {
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
}

// Mock data for demonstration
const mockLocations = [
  { id: "1", name: "پارکینگ مرکزی", address: "میدان آزادی، خیابان آزادی" },
  { id: "2", name: "پارکینگ غرب", address: "بلوار کشاورز، نبش کوچه ۱۲" },
];

const mockLots = [
  { id: "1", locationId: "1", name: "طبقه همکف", floorNumber: 0, totalCapacity: 50, occupiedSpaces: 32 },
  { id: "2", locationId: "1", name: "طبقه اول", floorNumber: 1, totalCapacity: 40, occupiedSpaces: 28 },
  { id: "3", locationId: "2", name: "طبقه همکف", floorNumber: 0, totalCapacity: 30, occupiedSpaces: 15 },
];

const mockReservations = [
  {
    id: "1",
    reservationCode: "PRK-ABC123",
    customerName: "علی رضایی",
    customerPhone: "09123456789",
    customerEmail: "ali@example.com",
    vehiclePlate: "۱۲۳۴۵۶۷۸",
    vehicleType: "CAR",
    spotNumber: "A-15",
    lotName: "طبقه همکف",
    locationName: "پارکینگ مرکزی",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    duration: 240,
    status: "CONFIRMED",
    totalAmount: 40000,
    isPaid: true,
    paymentMethod: "ONLINE",
  },
  {
    id: "2",
    reservationCode: "PRK-DEF456",
    customerName: "مریم احمدی",
    customerPhone: "09876543210",
    customerEmail: "maryam@example.com",
    vehiclePlate: "۸۷۶۵۴۳۲۱",
    vehicleType: "CAR",
    spotNumber: "B-08",
    lotName: "طبقه اول",
    locationName: "پارکینگ مرکزی",
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    duration: 180,
    status: "PENDING",
    totalAmount: 30000,
    isPaid: false,
    paymentMethod: null,
  },
];

const mockParkingSpots = [
  { id: "1", lotId: "1", spotNumber: "A-15", section: "A", floorNumber: 0, type: "STANDARD", status: "RESERVED" },
  { id: "2", lotId: "1", spotNumber: "A-16", section: "A", floorNumber: 0, type: "STANDARD", status: "AVAILABLE" },
  { id: "3", lotId: "2", spotNumber: "B-08", section: "B", floorNumber: 1, type: "STANDARD", status: "RESERVED" },
  { id: "4", lotId: "2", spotNumber: "B-09", section: "B", floorNumber: 1, type: "WIDE", status: "AVAILABLE" },
];

interface ReservationFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehiclePlate: string;
  vehicleType: string;
  locationId: string;
  lotId: string;
  spotId: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string;
}

function ReservationForm({ onSubmit, availableSpots }: { 
  onSubmit: (data: ReservationFormData) => void;
  availableSpots: any[];
}) {
  const [formData, setFormData] = useState<ReservationFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    vehiclePlate: "",
    vehicleType: "CAR",
    locationId: "",
    lotId: "",
    spotId: "",
    startTime: "",
    endTime: "",
    duration: 60,
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time
    const startDateTime = selectedDate ? 
      new Date(selectedDate.toISOString().split('T')[0] + 'T' + selectedTime + ':00') :
      new Date();

    const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

    onSubmit({
      ...formData,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });
  };

  const filteredLots = mockLots.filter(lot => lot.locationId === formData.locationId);
  const filteredSpots = availableSpots.filter(spot => spot.lotId === formData.lotId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">نام مشتری</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerPhone">شماره تلفن</Label>
          <Input
            id="customerPhone"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerEmail">ایمیل</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="vehiclePlate">پلاک خودرو</Label>
          <Input
            id="vehiclePlate"
            value={formData.vehiclePlate}
            onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="vehicleType">نوع خودرو</Label>
          <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAR">سواری</SelectItem>
              <SelectItem value="MOTORCYCLE">موتورسیکلت</SelectItem>
              <SelectItem value="TRUCK">کامیون</SelectItem>
              <SelectItem value="BUS">اتوبوس</SelectItem>
              <SelectItem value="VAN">وانت</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="locationId">مکان پارکینگ</Label>
          <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value, lotId: "", spotId: "" })}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب مکان" />
            </SelectTrigger>
            <SelectContent>
              {mockLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lotId">طبقه پارکینگ</Label>
          <Select value={formData.lotId} onValueChange={(value) => setFormData({ ...formData, lotId: value, spotId: "" })}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب طبقه" />
            </SelectTrigger>
            <SelectContent>
              {filteredLots.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name} (ظرفیت: {toPersianNumerals(lot.totalCapacity - lot.occupiedSpaces)} خالی)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="spotId">جای پارک (اختیاری)</Label>
          <Select value={formData.spotId} onValueChange={(value) => setFormData({ ...formData, spotId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب جای پارک" />
            </SelectTrigger>
            <SelectContent>
              {filteredSpots.map((spot) => (
                <SelectItem key={spot.id} value={spot.id}>
                  {spot.spotNumber} - {spot.type === "STANDARD" ? "استاندارد" : spot.type === "WIDE" ? "عریض" : spot.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>تاریخ رزرو</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={faIR}
            className="rounded-md border"
          />
        </div>
        <div>
          <Label htmlFor="startTime">ساعت شروع</Label>
          <Input
            id="startTime"
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
            min="30"
            max="1440"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">توضیحات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="توضیحات additional..."
        />
      </div>

      <Button type="submit" className="w-full">
        ایجاد رزرو
      </Button>
    </form>
  );
}

function ReservationCard({ reservation, onPaymentComplete }: { 
  reservation: any; 
  onPaymentComplete: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "ACTIVE": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "تأیید شده";
      case "PENDING": return "در انتظار پرداخت";
      case "ACTIVE": return "فعال";
      case "COMPLETED": return "تکمیل شده";
      case "CANCELLED": return "لغو شده";
      default: return status;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {reservation.reservationCode}
          </CardTitle>
          <Badge className={getStatusColor(reservation.status)}>
            {getStatusText(reservation.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          <span>{reservation.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4" />
          <span>{reservation.customerPhone}</span>
        </div>
        {reservation.customerEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span>{reservation.customerEmail}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4" />
          <span>پلاک: {reservation.vehiclePlate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{reservation.locationName} - {reservation.lotName}</span>
        </div>
        {reservation.spotNumber && (
          <div className="flex items-center gap-2 text-sm">
            <ParkingCircle className="h-4 w-4" />
            <span>جای پارک: {reservation.spotNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {formatPersianDate(reservation.startTime)} - {formatPersianDate(reservation.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>مدت: {toPersianNumerals(reservation.duration)} دقیقه</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4" />
          <span>مبلغ: {toPersianNumerals(reservation.totalAmount)} تومان</span>
        </div>
        <div className="flex items-center gap-2">
          {reservation.isPaid ? (
            <Badge className="bg-green-100 text-green-800">
              پرداخت شده
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              پرداخت نشده
            </Badge>
          )}
        </div>
        
        {/* Payment Section */}
        {!reservation.isPaid && (
          <div className="mt-4 pt-4 border-t">
            <ReservationPaymentProcessor 
              reservation={reservation} 
              onPaymentComplete={onPaymentComplete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReservationSystem() {
  const [reservations, setReservations] = useState(mockReservations);
  const [parkingSpots, setParkingSpots] = useState(mockParkingSpots);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const availableSpots = parkingSpots.filter(spot => spot.status === "AVAILABLE");

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.reservationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.vehiclePlate.includes(searchTerm);
    const matchesStatus = !statusFilter || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateReservation = async (data: ReservationFormData) => {
    try {
      // Here you would normally send the data to your API
      console.log("Creating reservation:", data);
      
      // Simulate API call
      const newReservation = {
        id: Date.now().toString(),
        reservationCode: `PRK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        vehiclePlate: data.vehiclePlate,
        vehicleType: data.vehicleType,
        spotNumber: data.spotId ? parkingSpots.find(s => s.id === data.spotId)?.spotNumber : null,
        lotName: mockLots.find(l => l.id === data.lotId)?.name || "",
        locationName: mockLocations.find(l => l.id === data.locationId)?.name || "",
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration: data.duration,
        status: "PENDING",
        totalAmount: Math.round(data.duration * 167), // Simple calculation
        isPaid: false,
        paymentMethod: null,
      };

      setReservations([newReservation, ...reservations]);
      setIsCreateDialogOpen(false);
      
      // Show success message
      alert("رزرو با موفقیت ایجاد شد");
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("خطا در ایجاد رزرو");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">سیستم رزرو پارکینگ</h1>
            <p className="text-gray-600 mt-1">
              مدیریت رزروهای پارکینگ و جای‌های پارک
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                رزرو جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ایجاد رزرو جدید</DialogTitle>
              </DialogHeader>
              <ReservationForm onSubmit={handleCreateReservation} availableSpots={availableSpots} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل رزروها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(reservations.length)}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">رزروهای فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(reservations.filter(r => r.status === "ACTIVE").length)}
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
                  <p className="text-sm text-gray-600">جای‌های خالی</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {toPersianNumerals(availableSpots.length)}
                  </p>
                </div>
                <ParkingCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">در انتظار پرداخت</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {toPersianNumerals(reservations.filter(r => !r.isPaid).length)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="جستجو بر اساس نام، کد رزرو یا پلاک..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه</SelectItem>
                    <SelectItem value="PENDING">در انتظار پرداخت</SelectItem>
                    <SelectItem value="CONFIRMED">تأیید شده</SelectItem>
                    <SelectItem value="ACTIVE">فعال</SelectItem>
                    <SelectItem value="COMPLETED">تکمیل شده</SelectItem>
                    <SelectItem value="CANCELLED">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard 
              key={reservation.id} 
              reservation={reservation} 
              onPaymentComplete={() => {
                // Refresh reservations data
                // In a real app, you would fetch fresh data from the API
                console.log('Payment completed, refreshing data...');
              }}
            />
          ))}
        </div>

        {filteredReservations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">هیچ رزروی یافت نشد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}