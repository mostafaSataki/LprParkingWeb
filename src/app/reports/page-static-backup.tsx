"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">داشبورد گزارش‌ها</h1>
          <p className="text-gray-600 mt-1">
            این یک صفحه کاملاً ایستا است
          </p>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold">تست ایستا</h2>
            <p>این صفحه هیچ state یا useEffect ندارد.</p>
            <p>اگر این صفحه کار کند، مشکل از state management است.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}