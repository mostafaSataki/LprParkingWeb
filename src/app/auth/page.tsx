"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  Lock, 
  MapPin, 
  Building, 
  Camera, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

function toPersianNumerals(num: number | string): string {
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
}

interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  role: "OPERATOR" | "ADMIN";
  isActive: boolean;
  assignedLocations: string[];
}

interface ParkingLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  cameras: Camera[];
}

interface Camera {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT";
  direction: "IN" | "OUT";
  isActive: boolean;
}

interface LoginFormData {
  username: string;
  password: string;
  locationId: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    username: "operator1",
    name: "علی رضایی",
    password: "123456",
    role: "OPERATOR",
    isActive: true,
    assignedLocations: ["1", "2"]
  },
  {
    id: "2", 
    username: "operator2",
    name: "مریم احمدی",
    password: "123456",
    role: "OPERATOR",
    isActive: true,
    assignedLocations: ["3"]
  },
  {
    id: "3",
    username: "admin",
    name: "مدیر سیستم",
    password: "admin123",
    role: "ADMIN",
    isActive: true,
    assignedLocations: ["1", "2", "3"]
  }
];

const mockLocations: ParkingLocation[] = [
  {
    id: "1",
    name: "پارکینگ مرکزی",
    description: "پارکینگ اصلی مرکز تجاری",
    address: "میدان آزادی، خیابان آزادی",
    isActive: true,
    cameras: [
      { id: "1", name: "دوربین ورودی اصلی", type: "ENTRY", direction: "IN", isActive: true },
      { id: "2", name: "دوربین خروجی اصلی", type: "EXIT", direction: "OUT", isActive: true }
    ]
  },
  {
    id: "2",
    name: "پارکینگ غرب",
    description: "پارکینگ مجتمع تجاری غرب",
    address: "بلوار کشاورز، خیابان غربی",
    isActive: true,
    cameras: [
      { id: "3", name: "دوربین ورودی غرب", type: "ENTRY", direction: "IN", isActive: true },
      { id: "4", name: "دوربین خروجی غرب", type: "EXIT", direction: "OUT", isActive: true }
    ]
  },
  {
    id: "3",
    name: "پارکینگ شرق",
    description: "پارکینگ مجتمع اداری شرق",
    address: "خیابان امام خمینی، خیابان شرقی",
    isActive: true,
    cameras: [
      { id: "5", name: "دوربین ورودی شرق", type: "ENTRY", direction: "IN", isActive: true },
      { id: "6", name: "دوربین خروجی شرق", type: "EXIT", direction: "OUT", isActive: true }
    ]
  }
];

interface LocationCardProps {
  location: ParkingLocation;
  isSelected: boolean;
  isOccupied: boolean;
  occupiedBy?: string;
  onSelect: (locationId: string) => void;
}

function LocationCard({ location, isSelected, isOccupied, occupiedBy, onSelect }: LocationCardProps) {
  const activeCameras = location.cameras.filter(c => c.isActive).length;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
      } ${isOccupied ? "opacity-60" : ""}`}
      onClick={() => !isOccupied && onSelect(location.id)}
    >
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
            {isOccupied && (
              <Badge variant="destructive">
                اشغال
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {location.description && (
          <p className="text-sm text-gray-600">{location.description}</p>
        )}
        
        {location.address && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{location.address}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4 text-gray-400" />
            <span>{toPersianNumerals(activeCameras)} دوربین فعال</span>
          </div>
          <div className="flex items-center gap-1">
            {location.cameras.map((camera, index) => (
              <div
                key={camera.id}
                className={`w-2 h-2 rounded-full ${
                  camera.isActive 
                    ? camera.type === "ENTRY" ? "bg-green-500" : "bg-red-500"
                    : "bg-gray-300"
                }`}
                title={camera.name}
              />
            ))}
          </div>
        </div>
        
        {isOccupied && occupiedBy && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              این محل توسط کاربر دیگری اشغال شده است: {occupiedBy}
            </AlertDescription>
          </Alert>
        )}
        
        {isSelected && (
          <div className="flex items-center justify-center p-2 bg-blue-100 rounded">
            <CheckCircle className="h-4 w-4 text-blue-600 mr-1" />
            <span className="text-sm text-blue-600 font-medium">انتخاب شده</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LoginFormProps {
  onLogin: (data: LoginFormData) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

function LoginForm({ onLogin, onCancel, loading, error }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    locationId: ""
  });

  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [availableLocations, setAvailableLocations] = useState<ParkingLocation[]>(mockLocations);

  // Simulate occupied locations (in real app, this would come from server)
  const occupiedLocations = ["2"]; // Location 2 is occupied by another user

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationId) {
      alert("لطفاً یک محل را انتخاب کنید");
      return;
    }
    onLogin(formData);
  };

  const handleLocationSelect = (locationId: string) => {
    const location = mockLocations.find(l => l.id === locationId);
    if (location) {
      setSelectedLocation(location);
      setFormData({ ...formData, locationId });
    }
  };

  const handleUsernameChange = (username: string) => {
    setFormData({ ...formData, username });
    
    // Filter locations based on user assignments
    const user = mockUsers.find(u => u.username === username);
    if (user) {
      const userLocations = mockLocations.filter(l => 
        user.assignedLocations.includes(l.id) && l.isActive
      );
      setAvailableLocations(userLocations);
    } else {
      setAvailableLocations(mockLocations.filter(l => l.isActive));
    }
  };

  const availableAndNotOccupied = availableLocations.filter(
    l => !occupiedLocations.includes(l.id)
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">ورود به سیستم</h2>
        <p className="text-gray-600 mt-1">لطفاً اطلاعات خود را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">نام کاربری</Label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="نام کاربری خود را وارد کنید"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">رمز عبور</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="رمز عبور خود را وارد کنید"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          <Label>انتخاب محل پارکینگ</Label>
          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
            {availableAndNotOccupied.length > 0 ? (
              availableAndNotOccupied.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  isOccupied={occupiedLocations.includes(location.id)}
                  onSelect={handleLocationSelect}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>هیچ محل فعالی برای این کاربر وجود ندارد</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={loading || !formData.locationId}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                در حال ورود...
              </>
            ) : (
              <>
                ورود به سیستم
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            انصراف
          </Button>
        </div>
      </form>

      {/* Demo Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">اطلاعات آزمایشی:</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p><strong>اپراتور ۱:</strong> operator1 / 123456</p>
          <p><strong>اپراتور ۲:</strong> operator2 / 123456</p>
          <p><strong>مدیر سیستم:</strong> admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default function LocationBasedAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLocation, setCurrentLocation] = useState<ParkingLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(true);

  const handleLogin = async (formData: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user
      const user = mockUsers.find(u => 
        u.username === formData.username && 
        u.password === formData.password &&
        u.isActive
      );

      if (!user) {
        setError("نام کاربری یا رمز عبور اشتباه است");
        return;
      }

      // Check if user has access to selected location
      if (!user.assignedLocations.includes(formData.locationId)) {
        setError("شما به این محل دسترسی ندارید");
        return;
      }

      // Find location
      const location = mockLocations.find(l => l.id === formData.locationId);
      if (!location || !location.isActive) {
        setError("مکان انتخاب شده معتبر نیست");
        return;
      }

      // Login successful
      setCurrentUser(user);
      setCurrentLocation(location);
      setIsLoggedIn(true);
      setShowLoginDialog(false);

    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentLocation(null);
    setShowLoginDialog(true);
  };

  const handleCancel = () => {
    setShowLoginDialog(false);
  };

  if (isLoggedIn && currentUser && currentLocation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">پنل مدیریت پارکینگ</h1>
              <p className="text-gray-600">خوش آمدید، {currentUser.name}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              خروج از سیستم
            </Button>
          </div>

          {/* User and Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات کاربر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">نام:</span>
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نام کاربری:</span>
                  <span className="font-medium">{currentUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نقش:</span>
                  <Badge variant={currentUser.role === "ADMIN" ? "default" : "secondary"}>
                    {currentUser.role === "ADMIN" ? "مدیر سیستم" : "اپراتور"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  اطلاعات محل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">نام محل:</span>
                  <span className="font-medium">{currentLocation.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">وضعیت:</span>
                  <Badge variant="default">فعال</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تعداد دوربین‌ها:</span>
                  <span className="font-medium">
                    {toPersianNumerals(currentLocation.cameras.filter(c => c.isActive).length)}
                  </span>
                </div>
                {currentLocation.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">آدرس:</span>
                    <span className="font-medium text-sm">{currentLocation.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cameras Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                وضعیت دوربین‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLocation.cameras.map((camera) => (
                  <Card key={camera.id} className={camera.isActive ? "border-green-200" : "border-red-200"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{camera.name}</h3>
                          <p className="text-sm text-gray-600">
                            {camera.type === "ENTRY" ? "ورودی" : "خروجی"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            camera.isActive ? "bg-green-500" : "bg-red-500"
                          }`} />
                          <span className="text-sm">
                            {camera.isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              شما با موفقیت به سیستم وارد شدید. اکنون می‌توانید از دوربین‌های این محل استفاده کنید.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">سیستم مدیریت پارکینگ هوشمند</CardTitle>
          <p className="text-gray-600">ورود با انتخاب محل پارکینگ</p>
        </CardHeader>
        <CardContent>
          <LoginForm
            onLogin={handleLogin}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}