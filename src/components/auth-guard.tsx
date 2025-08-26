"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/login-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Wifi, WifiOff } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "OPERATOR" | "SUPERVISOR" | "ADMIN" | "AUDITOR";
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, isLoggedIn, loading, currentLocation, currentGate } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show login modal if not logged in
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoggedIn]);

  // Check role requirements
  const hasRequiredRole = !requiredRole || 
    (user && (
      requiredRole === "OPERATOR" && user.role !== "AUDITOR" ||
      requiredRole === "SUPERVISOR" && ["SUPERVISOR", "ADMIN"].includes(user.role) ||
      requiredRole === "ADMIN" && user.role === "ADMIN" ||
      requiredRole === "AUDITOR" && user.role === "AUDITOR"
    ));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">عدم اتصال به اینترنت</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                لطفاً اتصال اینترنت خود را بررسی کنید و مجدداً تلاش کنید.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn || !user || !currentLocation || !currentGate) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">دسترسی به سیستم مدیریت پارکینگ</CardTitle>
              <p className="text-gray-600 mt-2">
                برای دسترسی به سیستم، لطفاً وارد حساب کاربری خود شوید
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  شما نیاز به ورود به سیستم دارید. لطفاً نام کاربری، رمز عبور، پارکینگ و درب مورد نظر را انتخاب کنید.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 text-center">
                <Wifi className="h-4 w-4 inline ml-1 text-green-500" />
                <span className="text-sm text-gray-600">وضعیت: متصل</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-600">دسترسی غیرمجاز</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                شما دسترسی لازم برای مشاهده این بخش را ندارید.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mt-2">
              سطح دسترسی مورد نیاز: {requiredRole}
            </p>
            <p className="text-sm text-gray-600">
              سطح دسترسی شما: {user.role}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}