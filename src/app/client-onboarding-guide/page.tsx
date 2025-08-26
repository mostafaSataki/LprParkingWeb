"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserPlus, 
  CreditCard, 
  Bell, 
  Car, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Settings,
  DollarSign,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Target,
  Star,
  Store
} from "lucide-react";

export default function ClientOnboardingGuidePage() {
  const [activeTab, setActiveTab] = useState("when");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <UserPlus className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">راهنمای معرفی مشتریان به سیستم</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            راهنمای کامل برای ثبت مشتریان جدید، ایجاد حساب اعتباری و مدیریت شارژ حساب‌ها
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">زمان ثبت نام</p>
                  <p className="text-2xl font-bold">۵-۱۰ دقیقه</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">حداقل شارژ اولیه</p>
                  <p className="text-2xl font-bold">{formatCurrency(50000)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تعداد خودروها</p>
                  <p className="text-2xl font-bold">۱ تا ۱۰</p>
                </div>
                <Car className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">پشتیبانی</p>
                  <p className="text-2xl font-bold">۲۴/۷</p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="when">چه زمانی؟</TabsTrigger>
            <TabsTrigger value="how">چگونه؟</TabsTrigger>
            <TabsTrigger value="benefits">مزایا</TabsTrigger>
            <TabsTrigger value="process">فرآیند</TabsTrigger>
            <TabsTrigger value="examples">مثال‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="when" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="ml-2 h-6 w-6" />
                  چه زمانی باید مشتری را به سیستم معرفی کنیم؟
                </CardTitle>
                <CardDescription>
                  شناسایی زمان‌های مناسب برای ثبت مشتریان در سیستم اعتباری
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">زمان‌های ایده‌آل</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>کارمندان شرکت‌ها و سازمان‌های مجاور</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>ساکنین آپارتمان‌ها و مجتمع‌های مسکونی</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>مشتریان پرتردد (روزانه ۵+ بار)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>صاحبان کسب‌وکارهای nearby</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>مشتریان VIP و خاص</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-800">زمان‌های مناسب</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <div className="h-4 w-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0" />
                          <span>مشتریان نیمه‌فعال (۲-۳ بار در هفته)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="h-4 w-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0" />
                          <span>بازدیدکنندگان اولیه که علاقه نشان داده‌اند</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="h-4 w-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0" />
                          <span>مشتریان در فصول پربازدید</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="h-4 w-4 bg-orange-500 rounded-full mt-0.5 flex-shrink-0" />
                          <span>هنگام معرفی دوستان توسط مشتریان فعلی</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>نکته مهم:</strong> قبل از ثبت مشتری، از وجود ظرفیت خالی در سیستم اطمینان حاصل کنید.
                    همچنین مطمئن شوید که مشتری شرایط استفاده از سیستم اعتباری را دارد.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="how" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="ml-2 h-6 w-6" />
                  چگونه مشتری را ثبت نام کنیم؟
                </CardTitle>
                <CardDescription>
                  مراحل گام به گام ثبت نام مشتری در سیستم اعتباری
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-800 mb-2">جمع‌آوری اطلاعات</h3>
                      <p className="text-sm text-blue-700 mb-2">
                        اطلاعات اولیه مشتری را جمع‌آوری کنید:
                      </p>
                      <ul className="text-sm text-blue-600 space-y-1">
                        <li>• نام و نام خانوادگی</li>
                        <li>• ایمیل و شماره تلفن</li>
                        <li>• کد ملی</li>
                        <li>• آدرس محل سکونت</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 mb-2">ثبت وسایل نقلیه</h3>
                      <p className="text-sm text-green-700 mb-2">
                        اطلاعات خودروهای مشتری را ثبت کنید:
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        <li>• پلاک‌های خودروها</li>
                        <li>• نوع هر خودرو (سواری، موتورسیکلت، وانت)</li>
                        <li>• میزان استفاده روزانه</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-800 mb-2">تنظیمات حساب اعتباری</h3>
                      <p className="text-sm text-purple-700 mb-2">
                        پارامترهای حساب اعتباری را تعیین کنید:
                      </p>
                      <ul className="text-sm text-purple-600 space-y-1">
                        <li>• موجودی اولیه (حداقل {formatCurrency(50000)})</li>
                        <li>• محدودیت ماهانه</li>
                        <li>• سقف اعتبار (برای استفاده با موجودی صفر)</li>
                        <li>• آستانه هشدار</li>
                        <li>• تنظیمات شارژ خودکار</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800 mb-2">تنظیمات اعلان‌ها</h3>
                      <p className="text-sm text-orange-700 mb-2">
                        نحوه اطلاع‌رسانی به مشتری را مشخص کنید:
                      </p>
                      <ul className="text-sm text-orange-600 space-y-1">
                        <li>• فعال‌سازی اعلان‌های ایمیل</li>
                        <li>• تنظیمات پیامک (اختیاری)</li>
                        <li>• اعلان‌های درون‌برنامه‌ای</li>
                        <li>• تعیین آستانه‌های هشدار</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800 mb-2">تایید و فعال‌سازی</h3>
                      <p className="text-sm text-red-700 mb-2">
                        مراحل نهایی را انجام دهید:
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        <li>• بررسی اطلاعات وارد شده</li>
                        <li>• شارژ اولیه حساب</li>
                        <li>• فعال‌سازی حساب</li>
                        <li>• ارسال ایمیل خوش‌آمدگویی</li>
                        <li>• آموزش استفاده از سیستم به مشتری</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="ml-2 h-6 w-6" />
                  مزایای سیستم اعتباری برای مشتریان
                </CardTitle>
                <CardDescription>
                  مزایای استفاده از سیستم اعتباری برای مشتریان و کسب‌وکار شما
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">مزایای برای مشتریان</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span><strong>ورود و خروج سریع:</strong> بدون نیاز به پرداخت نقدی در هر بار</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span><strong>اعتباری:</strong> امکان استفاده حتی با موجودی صفر</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Bell className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span><strong>اعلان‌های هوشمند:</strong> اطلاع‌رسانی موجودی و شارژ</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span><strong>گزارش‌های دقیق:</strong> مشاهده تاریخچه تردد و پرداخت‌ها</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span><strong>شارژ خودکار:</strong> نگرانی از شارژ حساب</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">مزایای برای کسب‌وکار</h3>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>درآمد پایدار:</strong> مشتریان وفادار و درآمد ثابت</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Users className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>افزایش مشتریان:</strong> جذب مشتریان جدید</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>مدیریت آسان:</strong> سیستم مدیریت یکپارچه</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>کاهش تقلب:</strong> کنترل دقیق تردد و پرداخت</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>خدمات بهتر:</strong> ارتباط بهتر با مشتریان</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-3xl font-bold text-blue-600 mb-2">۸۵٪</div>
                      <p className="text-sm text-gray-600">افزایش رضایت مشتریان</p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-3xl font-bold text-green-600 mb-2">۶۰٪</div>
                      <p className="text-sm text-gray-600">کاهش زمان ورود و خروج</p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-3xl font-bold text-purple-600 mb-2">۴۰٪</div>
                      <p className="text-sm text-gray-600">افزایش درآمد ماهانه</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="ml-2 h-6 w-6" />
                  فرآیند کامل ثبت نام و شارژ حساب
                </CardTitle>
                <CardDescription>
                  مراحل دقیق از ثبت نام تا شارژ اولیه حساب مشتری
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                    
                    <div className="relative flex items-start space-x-4 pb-8">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        1
                      </div>
                      <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">مصاحبه اولیه</h3>
                        <p className="text-sm text-blue-700">
                          با مشتری صحبت کنید و نیازها و انتظارات او را بررسی کنید. 
                          توضیح دهید که سیستم اعتباری چگونه کار می‌کند و چه مزایایی دارد.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۱۰-۱۵ دقیقه</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4 pb-8">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        2
                      </div>
                      <div className="flex-1 bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">تکمیل فرم ثبت نام</h3>
                        <p className="text-sm text-green-700">
                          فرم ثبت نام را با اطلاعات مشتری تکمیل کنید. شامل اطلاعات شخصی، 
                          تماس، و اطلاعات خودروها. مدارک لازم را بررسی کنید.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۵-۱۰ دقیقه</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4 pb-8">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        3
                      </div>
                      <div className="flex-1 bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-800 mb-2">بررسی و تایید</h3>
                        <p className="text-sm text-purple-700">
                          اطلاعات وارد شده را بررسی کنید. از صحت اطلاعات و مدارک اطمینان حاصل کنید. 
                          در صورت نیاز، اطلاعات تکمیلی را از مشتری بخواهید.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۵ دقیقه</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4 pb-8">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        4
                      </div>
                      <div className="flex-1 bg-orange-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-800 mb-2">ایجاد حساب اعتباری</h3>
                        <p className="text-sm text-orange-700">
                          حساب اعتباری مشتری را در سیستم ایجاد کنید. تنظیمات اولیه مانند 
                          موجودی اولیه، محدودیت‌ها و آستانه‌های هشدار را تنظیم کنید.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۳-۵ دقیقه</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4 pb-8">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        5
                      </div>
                      <div className="flex-1 bg-red-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-red-800 mb-2">شارژ اولیه حساب</h3>
                        <p className="text-sm text-red-700">
                          حساب مشتری را با مبلغ مورد نظر شارژ کنید. می‌توانید از شارژ سریع 
                          یا مبلغ دلخواه استفاده کنید. تراکنش شارژ را ثبت کنید.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۲-۳ دقیقه</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold z-10">
                        6
                      </div>
                      <div className="flex-1 bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">آموزش و تحویل</h3>
                        <p className="text-sm text-green-700">
                          به مشتری نحوه استفاده از سیستم را آموزش دهید. اطلاعات ورود به پنل 
                          کاربری را در اختیارش قرار دهید. راه‌های ارتباطی پشتیبانی را معرفی کنید.
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline">زمان: ۱۰-۱۵ دقیقه</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>مجموع زمان ثبت نام:</strong> تقریباً ۳۵-۵۰ دقیقه برای هر مشتری
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="ml-2 h-6 w-6" />
                  مثال‌های عملی و سناریوها
                </CardTitle>
                <CardDescription>
                  مثال‌های واقعی از ثبت نام مشتریان در شرایط مختلف
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">سناریو: کارمند شرکت</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong>مشتری:</strong> آقای رضایی، کارمند شرکت مجاور
                        </div>
                        <div>
                          <strong>نیاز:</strong> تردد روزانه ۲ بار (صبح و عصر)
                        </div>
                        <div>
                          <strong>تنظیمات پیشنهادی:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• موجودی اولیه: {formatCurrency(100000)}</li>
                            <li>• محدودیت ماهانه: {formatCurrency(300000)}</li>
                            <li>• سقف اعتبار: {formatCurrency(50000)}</li>
                            <li>• شارژ خودکار: ماهانه {formatCurrency(100000)}</li>
                          </ul>
                        </div>
                        <div>
                          <strong>نتیجه:</strong> رضایت کامل، کاهش زمان تردد ۷۰٪
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Car className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">سناریو: ساکن آپارتمان</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong>مشتری:</strong> خانم احمدی، ساکن مجتمع مسکونی
                        </div>
                        <div>
                          <strong>نیاز:</strong> تردد نامنظم، گاهی روزانه ۵+ بار
                        </div>
                        <div>
                          <strong>تنظیمات پیشنهادی:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• موجودی اولیه: {formatCurrency(200000)}</li>
                            <li>• محدودیت ماهانه: {formatCurrency(500000)}</li>
                            <li>• سقف اعتبار: {formatCurrency(100000)}</li>
                            <li>• شارژ خودکار: هفتگی {formatCurrency(50000)}</li>
                          </ul>
                        </div>
                        <div>
                          <strong>نتیجه:</strong> راحتی کامل، افزایش رضایت ۹۰٪
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Store className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-800">سناریو: صاحب کسب‌وکار</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong>مشتری:</strong> آقای محمدی، صاحب فروشگاه nearby
                        </div>
                        <div>
                          <strong>نیاز:</strong> تردد زیاد، وسیله نقلیه تجاری
                        </div>
                        <div>
                          <strong>تنظیمات پیشنهادی:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• موجودی اولیه: {formatCurrency(500000)}</li>
                            <li>• محدودیت ماهانه: {formatCurrency(2000000)}</li>
                            <li>• سقف اعتبار: {formatCurrency(300000)}</li>
                            <li>• شارژ خودکار: ماهانه {formatCurrency(500000)}</li>
                          </ul>
                        </div>
                        <div>
                          <strong>نتیجه:</strong> تسهیل تردد، افزایش درآمد ۵۰٪
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Phone className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-800">سناریو: مشتری VIP</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong>مشتری:</strong> خانم حسینی، مشتری ویژه
                        </div>
                        <div>
                          <strong>نیاز:</strong> خدمات VIP، تردد متغیر
                        </div>
                        <div>
                          <strong>تنظیمات پیشنهادی:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• موجودی اولیه: {formatCurrency(1000000)}</li>
                            <li>• محدودیت ماهانه: بدون محدودیت</li>
                            <li>• سقف اعتبار: {formatCurrency(500000)}</li>
                            <li>• شارژ خودکار: ماهانه {formatCurrency(1000000)}</li>
                          </ul>
                        </div>
                        <div>
                          <strong>نتیجه:</strong> خدمات اختصاصی، وفاداری ۱۰۰٪
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <strong>نکته:</strong> برای هر مشتری، بر اساس نیاز و الگوی استفاده، 
                    تنظیمات متفاوتی در نظر بگیرید. همیشه با مشتری مشورت کنید و 
                    تنظیمات را بر اساس نیازهای او شخصی‌سازی کنید.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-4">آماده شروع هستید؟</h3>
            <p className="text-gray-600 mb-6">
              با ثبت مشتریان جدید در سیستم اعتباری، درآمد خود را افزایش دهید و 
              رضایت مشتریان را به حداکثر برسانید.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="ml-2 h-5 w-5" />
                ثبت مشتری جدید
              </Button>
              <Button size="lg" variant="outline">
                <CreditCard className="ml-2 h-5 w-5" />
                شارژ حساب‌ها
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}