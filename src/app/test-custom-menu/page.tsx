"use client";

import React, { useState } from "react";
import { NavigationMenuCustom } from "@/components/navigation-menu-custom";

export default function TestCustomMenuPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentShift, setCurrentShift] = useState({
    name: "شیفت صبح",
    operator: "علی رضایی",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Test Custom Menu</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">صفحه تست منوی سفارشی</h2>
              <p className="text-gray-600">این صفحه برای تست عملکرد منوی سفارشی ایجاد شده است</p>
            </div>
            <NavigationMenuCustom 
              soundEnabled={soundEnabled}
              onSoundToggle={() => setSoundEnabled(!soundEnabled)}
              currentShift={currentShift}
            />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">وضعیت فعلی:</h3>
              <p className="text-sm text-gray-600">
                صدا: {soundEnabled ? 'فعال' : 'غیرفعال'}
              </p>
              <p className="text-sm text-gray-600">
                شیفت: {currentShift.name} - اپراتور: {currentShift.operator}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">دستورالعمل تست:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• روی دکمه "منو" کلیک کنید تا منوی بازشو باز شود</li>
                <li>• روی آیکون صدا کلیک کنید تا وضعیت صدا تغییر کند</li>
                <li>• روی آیتم‌های منو کلیک کنید به صفحات مختلف بروید</li>
                <li>• خارج از منو کلیک کنید تا منو بسته شود</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}