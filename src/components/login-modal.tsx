"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Lock, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Shield
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function toPersianNumerals(num: number | string): string {
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    gateId: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available gates for login (all gates from all locations)
  const availableGates = [
    // پارکینگ مرکزی
    { id: "1", name: "دریازه ورودی اصلی", type: "ENTRY", direction: "IN", isActive: true, locationName: "پارکینگ مرکزی" },
    { id: "2", name: "دریازه خروجی اصلی", type: "EXIT", direction: "OUT", isActive: true, locationName: "پارکینگ مرکزی" },
    // پارکینگ غرب
    { id: "3", name: "دریازه ورودی غرب", type: "ENTRY", direction: "IN", isActive: true, locationName: "پارکینگ غرب" },
    { id: "4", name: "دریازه خروجی غرب", type: "EXIT", direction: "OUT", isActive: true, locationName: "پارکینگ غرب" },
    // پارکینگ شرق
    { id: "5", name: "دریازه ورودی شرق", type: "ENTRY", direction: "IN", isActive: true, locationName: "پارکینگ شرق" },
    { id: "6", name: "دریازه خروجی شرق", type: "EXIT", direction: "OUT", isActive: true, locationName: "پارکینگ شرق" }
  ];

  const selectedGate = availableGates.find(g => g.id === formData.gateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    console.log('Form data being submitted:', formData);

    try {
      const success = await login(
        formData.username,
        formData.password,
        "", // locationId is no longer needed
        formData.gateId
      );

      if (success) {
        onClose();
      } else {
        setError("نام کاربری، رمز عبور یا دسترسی نامعتبر است");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (username: string) => {
    setFormData({ ...formData, username });
    setError("");
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ username: "", password: "", gateId: "" });
      setError("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            ورود به سیستم مدیریت پارکینگ هوشمند
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">نام کاربری</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="نام کاربری خود را وارد کنید"
                  required
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>انتخاب درب</Label>
              <Select
                value={formData.gateId}
                onValueChange={(value) => setFormData({ ...formData, gateId: value })}
                disabled={isSubmitting || !formData.username}
              >
                <SelectTrigger>
                  <SelectValue placeholder="درب را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {availableGates.map((gate) => (
                    <SelectItem key={gate.id} value={gate.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <span>{gate.name}</span>
                          <div className="text-xs text-gray-500">{gate.locationName}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {gate.type === "ENTRY" ? "ورودی" : "خروجی"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={isSubmitting || !formData.username || !formData.password || !formData.gateId}
              >
                {isSubmitting ? (
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
                onClick={onClose}
                disabled={isSubmitting}
              >
                انصراف
              </Button>
            </div>
          </form>

          {/* Selected Gate Info */}
          {selectedGate && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-5 w-5" />
                  اطلاعات انتخاب شده
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">درب:</span>
                  </div>
                  <div className="mt-1">
                    <p className="font-semibold text-blue-900">{selectedGate.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant={selectedGate.type === "ENTRY" ? "default" : "secondary"} className="text-xs">
                        {selectedGate.type === "ENTRY" ? "ورودی" : "خروجی"}
                      </Badge>
                      <span className="text-xs text-blue-600">{selectedGate.locationName}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demo Information */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                اطلاعات آزمایشی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">کاربران سیستم:</h4>
                  <div className="space-y-1 text-amber-700">
                    <p><strong>اپراتور ۱:</strong> operator1 / 123456</p>
                    <p><strong>اپراتور ۲:</strong> operator2 / 123456</p>
                    <p><strong>ناظر:</strong> supervisor1 / 123456</p>
                    <p><strong>مدیر سیستم:</strong> admin / admin123</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">دسترسی‌ها:</h4>
                  <div className="space-y-1 text-amber-700">
                    <p>• اپراتورها: دسترسی به درب‌های اختصاصی</p>
                    <p>• ناظر: دسترسی به تمام درب‌ها</p>
                    <p>• مدیر: دسترسی کامل به سیستم</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}