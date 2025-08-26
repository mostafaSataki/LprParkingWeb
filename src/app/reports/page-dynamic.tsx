"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  
  // Simulate data loading without useEffect
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">داشبورد گزارش‌ها</h1>
          <p className="text-gray-600 mt-1">
            گزارش‌ها با موفقیت بارگذاری شدند
          </p>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold">تست موفق</h2>
            <p>این صفحه بدون استفاده از useEffect کار می‌کند.</p>
            <Button 
              onClick={() => setLoading(true)}
              className="mt-4"
            >
              تست مجدد بارگذاری
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}