"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { UserPlus, CreditCard, AlertCircle, CheckCircle, Info } from "lucide-react";

interface ClientRegistrationData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  
  // Account Settings
  initialBalance: number;
  monthlyLimit: number;
  creditLimit: number;
  warningThreshold: number;
  autoCharge: boolean;
  monthlyChargeAmount: number;
  chargeDayOfMonth: number;
  
  // Notification Preferences
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableInAppNotifications: boolean;
  
  // Vehicle Information
  plateNumbers: string[];
  vehicleTypes: string[];
}

interface ClientRegistrationFormProps {
  onSubmit: (data: ClientRegistrationData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientRegistrationForm({ onSubmit, onCancel, isLoading = false }: ClientRegistrationFormProps) {
  const [formData, setFormData] = useState<ClientRegistrationData>({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    address: "",
    initialBalance: 0,
    monthlyLimit: 100000,
    creditLimit: 50000,
    warningThreshold: 10000,
    autoCharge: true,
    monthlyChargeAmount: 100000,
    chargeDayOfMonth: 1,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableInAppNotifications: true,
    plateNumbers: [""],
    vehicleTypes: ["CAR"],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("personal");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Personal Information Validation
    if (!formData.name.trim()) {
      newErrors.name = "نام مشتری الزامی است";
    }
    if (!formData.email.trim()) {
      newErrors.email = "ایمیل الزامی است";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "ایمیل نامعتبر است";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "شماره تلفن الزامی است";
    }
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "کد ملی الزامی است";
    }

    // Account Settings Validation
    if (formData.initialBalance < 0) {
      newErrors.initialBalance = "موجودی اولیه نمی‌تواند منفی باشد";
    }
    if (formData.monthlyLimit < 0) {
      newErrors.monthlyLimit = "محدودیت ماهانه نمی‌تواند منفی باشد";
    }
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = "سقف اعتبار نمی‌تواند منفی باشد";
    }
    if (formData.warningThreshold < 0) {
      newErrors.warningThreshold = "آستانه هشدار نمی‌تواند منفی باشد";
    }
    if (formData.autoCharge && formData.monthlyChargeAmount <= 0) {
      newErrors.monthlyChargeAmount = "مبلغ شارژ ماهانه باید بیشتر از صفر باشد";
    }
    if (formData.chargeDayOfMonth < 1 || formData.chargeDayOfMonth > 31) {
      newErrors.chargeDayOfMonth = "روز شارژ باید بین ۱ تا ۳۱ باشد";
    }

    // Vehicle Information Validation
    const validPlates = formData.plateNumbers.filter(plate => plate.trim());
    if (validPlates.length === 0) {
      newErrors.plateNumbers = "حداقل یک پلاک خودرو الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        plateNumbers: formData.plateNumbers.filter(plate => plate.trim()),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const updateFormData = (field: keyof ClientRegistrationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addPlateNumber = () => {
    updateFormData("plateNumbers", [...formData.plateNumbers, ""]);
    updateFormData("vehicleTypes", [...formData.vehicleTypes, "CAR"]);
  };

  const removePlateNumber = (index: number) => {
    if (formData.plateNumbers.length > 1) {
      const newPlates = formData.plateNumbers.filter((_, i) => i !== index);
      const newTypes = formData.vehicleTypes.filter((_, i) => i !== index);
      updateFormData("plateNumbers", newPlates);
      updateFormData("vehicleTypes", newTypes);
    }
  };

  const updatePlateNumber = (index: number, value: string) => {
    const newPlates = [...formData.plateNumbers];
    newPlates[index] = value;
    updateFormData("plateNumbers", newPlates);
  };

  const updateVehicleType = (index: number, value: string) => {
    const newTypes = [...formData.vehicleTypes];
    newTypes[index] = value;
    updateFormData("vehicleTypes", newTypes);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="ml-2 h-6 w-6" />
            ثبت مشتری جدید
          </CardTitle>
          <CardDescription>
            ثبت مشتری جدید و ایجاد حساب اعتباری برای استفاده از سیستم پارکینگ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">اطلاعات شخصی</TabsTrigger>
                <TabsTrigger value="account">حساب اعتباری</TabsTrigger>
                <TabsTrigger value="vehicles">وسایل نقلیه</TabsTrigger>
                <TabsTrigger value="notifications">اعلان‌ها</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">نام و نام خانوادگی *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">ایمیل *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">شماره تلفن *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nationalId">کد ملی *</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => updateFormData("nationalId", e.target.value)}
                      className={errors.nationalId ? "border-red-500" : ""}
                    />
                    {errors.nationalId && (
                      <p className="text-sm text-red-500 mt-1">{errors.nationalId}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">آدرس</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Account Settings Tab */}
              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="initialBalance">موجودی اولیه (تومان)</Label>
                    <Input
                      id="initialBalance"
                      type="number"
                      value={formData.initialBalance}
                      onChange={(e) => updateFormData("initialBalance", Number(e.target.value))}
                      className={errors.initialBalance ? "border-red-500" : ""}
                    />
                    {errors.initialBalance && (
                      <p className="text-sm text-red-500 mt-1">{errors.initialBalance}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="monthlyLimit">محدودیت ماهانه (تومان)</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      value={formData.monthlyLimit}
                      onChange={(e) => updateFormData("monthlyLimit", Number(e.target.value))}
                      className={errors.monthlyLimit ? "border-red-500" : ""}
                    />
                    {errors.monthlyLimit && (
                      <p className="text-sm text-red-500 mt-1">{errors.monthlyLimit}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="creditLimit">سقف اعتبار (تومان)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => updateFormData("creditLimit", Number(e.target.value))}
                      className={errors.creditLimit ? "border-red-500" : ""}
                    />
                    {errors.creditLimit && (
                      <p className="text-sm text-red-500 mt-1">{errors.creditLimit}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="warningThreshold">آستانه هشدار (تومان)</Label>
                    <Input
                      id="warningThreshold"
                      type="number"
                      value={formData.warningThreshold}
                      onChange={(e) => updateFormData("warningThreshold", Number(e.target.value))}
                      className={errors.warningThreshold ? "border-red-500" : ""}
                    />
                    {errors.warningThreshold && (
                      <p className="text-sm text-red-500 mt-1">{errors.warningThreshold}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoCharge"
                      checked={formData.autoCharge}
                      onCheckedChange={(checked) => updateFormData("autoCharge", checked)}
                    />
                    <Label htmlFor="autoCharge">شارژ خودکار ماهانه</Label>
                  </div>

                  {formData.autoCharge && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
                      <div>
                        <Label htmlFor="monthlyChargeAmount">مبلغ شارژ ماهانه (تومان)</Label>
                        <Input
                          id="monthlyChargeAmount"
                          type="number"
                          value={formData.monthlyChargeAmount}
                          onChange={(e) => updateFormData("monthlyChargeAmount", Number(e.target.value))}
                          className={errors.monthlyChargeAmount ? "border-red-500" : ""}
                        />
                        {errors.monthlyChargeAmount && (
                          <p className="text-sm text-red-500 mt-1">{errors.monthlyChargeAmount}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="chargeDayOfMonth">روز شارژ در ماه</Label>
                        <Select
                          value={formData.chargeDayOfMonth.toString()}
                          onValueChange={(value) => updateFormData("chargeDayOfMonth", Number(value))}
                        >
                          <SelectTrigger className={errors.chargeDayOfMonth ? "border-red-500" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day} ام هر ماه
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.chargeDayOfMonth && (
                          <p className="text-sm text-red-500 mt-1">{errors.chargeDayOfMonth}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    مشتری می‌تواند تا سقف اعتبار ({formatCurrency(formData.creditLimit)} تومان) 
                    حتی با موجودی صفر از پارکینگ استفاده کند. مبلغ کسر شده در پایان ماه به همراه هزینه‌ها 
                    از حساب مشتری کسر خواهد شد.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Vehicles Tab */}
              <TabsContent value="vehicles" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">وسایل نقلیه مشتری</h3>
                    <Button type="button" variant="outline" onClick={addPlateNumber}>
                      افزودن خودرو
                    </Button>
                  </div>

                  {formData.plateNumbers.map((plate, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <Label htmlFor={`plate-${index}`}>پلاک خودرو *</Label>
                          <Input
                            id={`plate-${index}`}
                            value={plate}
                            onChange={(e) => updatePlateNumber(index, e.target.value)}
                            placeholder="مثال: ۱۲۳۴۵۶۷۸"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`type-${index}`}>نوع خودرو</Label>
                          <Select
                            value={formData.vehicleTypes[index]}
                            onValueChange={(value) => updateVehicleType(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CAR">خودرو سواری</SelectItem>
                              <SelectItem value="MOTORCYCLE">موتورسیکلت</SelectItem>
                              <SelectItem value="TRUCK">کامیون</SelectItem>
                              <SelectItem value="BUS">اتوبوس</SelectItem>
                              <SelectItem value="VAN">وانت</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePlateNumber(index)}
                            disabled={formData.plateNumbers.length === 1}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {errors.plateNumbers && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.plateNumbers}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">تنظیمات اعلان‌ها</h3>
                      <p className="text-sm text-gray-600">
                        نحوه اطلاع‌رسانی به مشتری را مشخص کنید
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">ایمیل</h4>
                          <p className="text-sm text-gray-600">ارسال اعلان‌ها via ایمیل</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableEmailNotifications}
                        onCheckedChange={(checked) => updateFormData("enableEmailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">پیامک</h4>
                          <p className="text-sm text-gray-600">ارسال اعلان‌ها via SMS</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableSMSNotifications}
                        onCheckedChange={(checked) => updateFormData("enableSMSNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <h4 className="font-medium">اعلان درون‌برنامه‌ای</h4>
                          <p className="text-sm text-gray-600">نمایش اعلان‌ها در پنل کاربری</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableInAppNotifications}
                        onCheckedChange={(checked) => updateFormData("enableInAppNotifications", checked)}
                      />
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      اعلان‌ها شامل موارد زیر می‌شوند:
                      <ul className="list-disc list-inside mt-2 text-sm">
                        <li>کاهش موجودی حساب</li>
                        <li>شارژ ماهانه حساب</li>
                        <li>هشدارهای موجودی پایین</li>
                        <li>تغییرات در تنظیمات حساب</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                انصراف
              </Button>
              <div className="flex space-x-2">
                {activeTab !== "personal" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["personal", "account", "vehicles", "notifications"];
                      const currentIndex = tabs.indexOf(activeTab);
                      setActiveTab(tabs[currentIndex - 1]);
                    }}
                  >
                    مرحله قبل
                  </Button>
                )}
                
                {activeTab !== "notifications" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const tabs = ["personal", "account", "vehicles", "notifications"];
                      const currentIndex = tabs.indexOf(activeTab);
                      setActiveTab(tabs[currentIndex + 1]);
                    }}
                  >
                    مرحله بعد
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="ml-2 h-4 w-4" />
                        ثبت مشتری
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}