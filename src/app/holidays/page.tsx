"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersianCalendar } from "@/components/persian-calendar";
import { 
  Calendar, 
  Settings, 
  BarChart3,
  Download,
  Upload
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface Holiday {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  type: "OFFICIAL" | "RELIGIOUS" | "CUSTOM";
  description?: string;
}

export default function HolidaysPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const handleHolidayChange = (newHolidays: Holiday[]) => {
    setHolidays(newHolidays);
  };

  const handleExportHolidays = () => {
    const holidayData = holidays.map(holiday => ({
      name: holiday.name,
      date: formatPersianDate(holiday.date, "YYYY/MM/DD"),
      type: holiday.type,
      description: holiday.description || ""
    }));

    const dataStr = JSON.stringify(holidayData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `holidays-${selectedYear}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportHolidays = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          // Import holidays
          for (const holidayData of data) {
            const response = await fetch('/api/holidays', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: holidayData.name,
                date: new Date(holidayData.date).toISOString(),
                type: holidayData.type || 'OFFICIAL',
                description: holidayData.description,
                isRecurring: false
              }),
            });
            
            if (!response.ok) {
              console.error('Error importing holiday:', holidayData);
            }
          }
          
          // Reload holidays
          window.location.reload();
        } catch (error) {
          console.error('Error importing holidays:', error);
          alert('خطا در وارد کردن تعطیلات');
        }
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت تعطیلات</h1>
            <p className="text-gray-600 mt-1">
              تعریف و مدیریت تعطیلات رسمی، مذهبی و سفارشی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportHolidays}
            >
              <Download className="h-4 w-4 ml-2" />
              خروجی
            </Button>
            <Button
              variant="outline"
              onClick={handleImportHolidays}
            >
              <Upload className="h-4 w-4 ml-2" />
              ورودی
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">تقویم</TabsTrigger>
            <TabsTrigger value="list">لیست تعطیلات</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <PersianCalendar
              year={selectedYear}
              onHolidayChange={handleHolidayChange}
            />
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>لیست کامل تعطیلات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Friday notice */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium text-purple-800">توجه:</span>
                    </div>
                    <p className="text-purple-700 mt-1">
                      تمامی روزهای جمعه به صورت پیش‌فرض تعطیل هستند و نیازی به تعریف جداگانه ندارند.
                    </p>
                  </div>
                  
                  {/* Holiday list */}
                  <div className="space-y-2">
                    {holidays.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        هیچ تعطیلی تعریف نشده است
                      </p>
                    ) : (
                      holidays
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((holiday) => {
                          const typeConfig = {
                            OFFICIAL: { color: "bg-red-100 text-red-800 border-red-200", label: "رسمی" },
                            RELIGIOUS: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "مذهبی" },
                            CUSTOM: { color: "bg-green-100 text-green-800 border-green-200", label: "سفارشی" }
                          };
                          
                          const config = typeConfig[holiday.type];
                          
                          return (
                            <div
                              key={holiday.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                  {config.label}
                                </div>
                                <div>
                                  <div className="font-medium">{holiday.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {formatPersianDate(holiday.date, "YYYY/MM/DD")}
                                    {holiday.description && (
                                      <span className="mr-2">- {holiday.description}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {holiday.isRecurring ? "سالانه" : "یک بار"}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات تعطیلات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">راهنمای استفاده</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <p>برای تعریف تعطیلی جدید، روی تاریخ مورد نظر در تقویم کلیک کنید</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <p>روزهای جمعه به صورت پیش‌فرض تعطیل هستند و قابل تغییر نیستند</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <p>می‌توانید تعطیلات را از فایل JSON وارد یا به فایل خروجی بگیرید</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <p>تعطیلات رسمی و مذهبی معمولاً سالانه تکرار می‌شوند</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">انواع تعطیلات</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-red-800">تعطیلات رسمی</div>
                          <div className="text-sm text-red-600">
                            مانند عید نوروز، روز جمهوری اسلامی، و غیره
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-blue-800">تعطیلات مذهبی</div>
                          <div className="text-sm text-blue-600">
                            مانند عید فطر، عید قربان، و غیره
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-green-800">تعطیلات سفارشی</div>
                          <div className="text-sm text-green-600">
                            تعطیلات محلی یا سازمانی خاص
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">عملیات انبوه</h3>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleExportHolidays}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      خروجی JSON تعطیلات
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImportHolidays}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      ورودی JSON تعطیلات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}