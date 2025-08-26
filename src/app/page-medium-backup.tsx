"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, CreditCard, Clock, Users, BarChart3, Settings, LogOut } from "lucide-react";

export default function MediumPage() {
  const [entryCameraActive, setEntryCameraActive] = useState(true);
  const [exitCameraActive, setExitCameraActive] = useState(true);

  const stats = {
    totalCapacity: 100,
    occupiedSpaces: 67,
    todaySessions: 45,
    todayRevenue: 1250000,
    activeSessions: 3
  };

  const mockSessions = [
    {
      id: "1",
      plateNumber: "۱۲۳۴۵۶۷۸",
      entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      vehicleType: "CAR",
      status: "ACTIVE",
      duration: 120,
      amount: 15000
    },
    {
      id: "2",
      plateNumber: "۸۷۶۵۴۳۲۱",
      entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      vehicleType: "CAR",
      status: "ACTIVE",
      duration: 60,
      amount: 8000
    },
    {
      id: "3",
      plateNumber: "۱۱۱۲۲۳۳",
      entryTime: new Date(Date.now() - 45 * 60 * 1000),
      vehicleType: "MOTORCYCLE",
      status: "ACTIVE",
      duration: 45,
      amount: 5000
    }
  ];

  function formatPersianDate(date: Date, format: string = "YYYY/MM/DD HH:mm"): string {
    // Simple Persian date formatter for testing
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('fa-IR', options).format(date);
  }

  function toPersianNumerals(num: number | string): string {
    const str = num.toString();
    const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">سیستم مدیریت پارکینگ هوشمند</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">شیفت صبح</p>
              <p className="text-sm text-gray-600">اپراتور: علی رضایی</p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 ml-2" />
              تنظیمات
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/tariffs">
                <CreditCard className="h-4 w-4 ml-2" />
                تعرفه‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/pos">
                <CreditCard className="h-4 w-4 ml-2" />
                دستگاه‌های POS
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/shifts">
                <Clock className="h-4 w-4 ml-2" />
                شیفت‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/users">
                <Users className="h-4 w-4 ml-2" />
                کاربران
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/reports">
                <BarChart3 className="h-4 w-4 ml-2" />
                گزارش‌ها
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/hardware">
                <Settings className="h-4 w-4 ml-2" />
                سخت‌افزار
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ظرفیت کل</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.totalCapacity)}</p>
                </div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فضای اشغالی</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {toPersianNumerals(stats.occupiedSpaces)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">
                    {Math.round((stats.occupiedSpaces / stats.totalCapacity) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تردد امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todaySessions)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درآمد امروز</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.todayRevenue.toLocaleString())}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فعال‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(stats.activeSessions)}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>وسایل نقلیه فعال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{session.plateNumber}</p>
                    <p className="text-sm text-gray-600">
                      {formatPersianDate(session.entryTime, "HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{session.duration} دقیقه</Badge>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {toPersianNumerals(session.amount.toLocaleString())} تومان
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Camera Views */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>دوربین ورودی</span>
                <Button
                  variant={entryCameraActive ? "default" : "destructive"}
                  size="sm"
                  onClick={() => setEntryCameraActive(!entryCameraActive)}
                >
                  {entryCameraActive ? "فعال" : "غیرفعال"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-2xl mb-2">📹</div>
                  <p>دوربین {entryCameraActive ? "فعال" : "غیرفعال"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>دوربین خروجی</span>
                <Button
                  variant={exitCameraActive ? "default" : "destructive"}
                  size="sm"
                  onClick={() => setExitCameraActive(!exitCameraActive)}
                >
                  {exitCameraActive ? "فعال" : "غیرفعال"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-2xl mb-2">📹</div>
                  <p>دوربین {exitCameraActive ? "فعال" : "غیرفعال"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}