"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle, Clock, Settings, Send, Eye, EyeOff, Filter, Search } from "lucide-react";

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'LOW_BALANCE' | 'MONTHLY_CHARGE_SUCCESS' | 'MONTHLY_CHARGE_FAILED' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_REACTIVATED' | 'CREDIT_LIMIT_EXCEEDED' | 'PAYMENT_FAILED' | 'MANUAL_CHARGE';
  subject: string;
  message: string;
  isActive: boolean;
  channels: ('EMAIL' | 'SMS' | 'IN_APP')[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface NotificationLog {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationSettings {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableInAppNotifications: boolean;
  lowBalanceThreshold: number;
  warningThreshold1: number;
  warningThreshold2: number;
  criticalThreshold: number;
  emailTemplate: string;
  smsTemplate: string;
  inAppTemplate: string;
}

interface ClientNotificationSystemProps {
  accountId?: string;
  onSendNotification: (accountId: string, type: string, message: string, channels: string[]) => Promise<void>;
  onUpdateSettings: (settings: NotificationSettings) => Promise<void>;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

export function ClientNotificationSystem({ 
  accountId, 
  onSendNotification, 
  onUpdateSettings, 
  onMarkAsRead 
}: ClientNotificationSystemProps) {
  const [activeTab, setActiveTab] = useState("logs");
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableInAppNotifications: true,
    lowBalanceThreshold: 10000,
    warningThreshold1: 50000,
    warningThreshold2: 20000,
    criticalThreshold: 5000,
    emailTemplate: '',
    smsTemplate: '',
    inAppTemplate: ''
  });
  const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    // Mock notification logs
    const mockNotifications: NotificationLog[] = [
      {
        id: '1',
        accountId: 'acc1',
        accountName: 'علی رضایی',
        type: 'LOW_BALANCE',
        title: 'کاهش موجودی حساب',
        message: 'موجودی حساب شما به ۵,۰۰۰ تومان رسیده است. لطفاً حساب خود را شارژ کنید.',
        severity: 'HIGH',
        channel: 'EMAIL',
        status: 'SENT',
        sentAt: new Date().toISOString(),
        readAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        accountId: 'acc2',
        accountName: 'مریم احمدی',
        type: 'MONTHLY_CHARGE_SUCCESS',
        title: 'شارژ ماهانه موفق',
        message: 'حساب شما با مبلغ ۱۰۰,۰۰۰ تومان با موفقیت شارژ شد.',
        severity: 'LOW',
        channel: 'IN_APP',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        readAt: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Mock templates
    const mockTemplates: NotificationTemplate[] = [
      {
        id: '1',
        name: 'هشدار موجودی پایین',
        type: 'LOW_BALANCE',
        subject: 'هشدار کاهش موجودی حساب',
        message: 'موجودی حساب شما به {balance} تومان رسیده است. لطفاً حساب خود را شارژ کنید.',
        isActive: true,
        channels: ['EMAIL', 'IN_APP'],
        severity: 'HIGH'
      },
      {
        id: '2',
        name: 'شارژ ماهانه موفق',
        type: 'MONTHLY_CHARGE_SUCCESS',
        subject: 'شارژ ماهانه حساب',
        message: 'حساب شما با مبلغ {amount} تومان با موفقیت شارژ شد.',
        isActive: true,
        channels: ['EMAIL', 'SMS', 'IN_APP'],
        severity: 'LOW'
      }
    ];

    setNotifications(mockNotifications);
    setTemplates(mockTemplates);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'ALL' || notification.status === filter || notification.severity === filter;
    const matchesSearch = notification.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("fa-IR");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'success';
      case 'DELIVERED': return 'success';
      case 'FAILED': return 'destructive';
      case 'PENDING': return 'warning';
      default: return 'secondary';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      case 'IN_APP': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await onMarkAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSendNotification = async (type: string, message: string, channels: string[]) => {
    if (!accountId) return;
    
    try {
      await onSendNotification(accountId, type, message, channels);
      setShowSendDialog(false);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleUpdateSettings = async (newSettings: NotificationSettings) => {
    try {
      await onUpdateSettings(newSettings);
      setSettings(newSettings);
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">سیستم اعلان‌ها</h1>
          <p className="text-muted-foreground">مدیریت اعلان‌های مشتریان و تنظیمات</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="ml-2 h-4 w-4" />
                تنظیمات
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تنظیمات اعلان‌ها</DialogTitle>
                <DialogDescription>
                  تنظیمات سیستم اعلان‌ها و آستانه‌های هشدار
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">کانال‌های اطلاع‌رسانی</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>ایمیل</span>
                      </div>
                      <Switch
                        checked={settings.enableEmailNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableEmailNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>پیامک</span>
                      </div>
                      <Switch
                        checked={settings.enableSMSNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableSMSNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span>اعلان درون‌برنامه‌ای</span>
                      </div>
                      <Switch
                        checked={settings.enableInAppNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, enableInAppNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">آستانه‌های هشدار</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lowBalanceThreshold">آستانه هشدار اولیه</Label>
                      <Input
                        id="lowBalanceThreshold"
                        type="number"
                        value={settings.lowBalanceThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, lowBalanceThreshold: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="warningThreshold1">آستانه هشدار دوم</Label>
                      <Input
                        id="warningThreshold1"
                        type="number"
                        value={settings.warningThreshold1}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, warningThreshold1: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="warningThreshold2">آستانه هشدار سوم</Label>
                      <Input
                        id="warningThreshold2"
                        type="number"
                        value={settings.warningThreshold2}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, warningThreshold2: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="criticalThreshold">آستانه بحرانی</Label>
                      <Input
                        id="criticalThreshold"
                        type="number"
                        value={settings.criticalThreshold}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, criticalThreshold: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                    انصراف
                  </Button>
                  <Button onClick={() => handleUpdateSettings(settings)}>
                    ذخیره تنظیمات
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="ml-2 h-4 w-4" />
                ارسال اعلان
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ارسال اعلان جدید</DialogTitle>
                <DialogDescription>
                  ارسال اعلان به مشتری
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notificationType">نوع اعلان</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="نوع اعلان را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW_BALANCE">هشدار موجودی پایین</SelectItem>
                      <SelectItem value="MANUAL_CHARGE">شارژ دستی</SelectItem>
                      <SelectItem value="ACCOUNT_REACTIVATED">فعال‌سازی حساب</SelectItem>
                      <SelectItem value="CUSTOM">سفارشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notificationMessage">پیام اعلان</Label>
                  <Input
                    id="notificationMessage"
                    placeholder="پیام اعلان را وارد کنید"
                  />
                </div>
                <div>
                  <Label>کانال‌های ارسال</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <Mail className="h-4 w-4" />
                      <span>ایمیل</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <MessageSquare className="h-4 w-4" />
                      <span>پیامک</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <Bell className="h-4 w-4" />
                      <span>درون‌برنامه‌ای</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                    انصراف
                  </Button>
                  <Button onClick={() => handleSendNotification('CUSTOM', 'پیام تست', ['EMAIL', 'IN_APP'])}>
                    ارسال اعلان
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">کل اعلان‌ها</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">اعلان‌های خوانده شده</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.readAt).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">اعلان‌های بحرانی</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.severity === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">نرخ تحویل</p>
                <p className="text-2xl font-bold">
                  {Math.round((notifications.filter(n => n.status === 'DELIVERED').length / notifications.length) * 100)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">تاریخچه اعلان‌ها</TabsTrigger>
          <TabsTrigger value="templates">قالب‌ها</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات پیشرفته</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>تاریخچه اعلان‌ها</CardTitle>
                  <CardDescription>
                    مشاهده و مدیریت اعلان‌های ارسال شده
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Filter className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="pr-10 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">همه</SelectItem>
                        <SelectItem value="SENT">ارسال شده</SelectItem>
                        <SelectItem value="DELIVERED">تحویل داده شده</SelectItem>
                        <SelectItem value="FAILED">ناموفق</SelectItem>
                        <SelectItem value="CRITICAL">بحرانی</SelectItem>
                        <SelectItem value="HIGH">بالا</SelectItem>
                        <SelectItem value="MEDIUM">متوسط</SelectItem>
                        <SelectItem value="LOW">پایین</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getChannelIcon(notification.channel)}
                            <Badge variant={getSeverityColor(notification.severity) as any}>
                              {notification.severity}
                            </Badge>
                            <Badge variant={getStatusColor(notification.status) as any}>
                              {notification.status}
                            </Badge>
                            {!notification.readAt && (
                              <Badge variant="secondary">جدید</Badge>
                            )}
                          </div>
                          <h4 className="font-medium mb-1">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>مشتری: {notification.accountName}</span>
                            <span>ارسال: {formatDate(notification.sentAt)}</span>
                            {notification.readAt && (
                              <span>خوانده: {formatDate(notification.readAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!notification.readAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            جزئیات
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قالب‌های اعلان</CardTitle>
              <CardDescription>
                مدیریت قالب‌های اعلان‌های سیستم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Switch checked={template.isActive} />
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">موضوع:</span> {template.subject}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">پیام:</span> {template.message}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(template.severity) as any}>
                            {template.severity}
                          </Badge>
                          <div className="flex space-x-1">
                            {template.channels.includes('EMAIL') && <Mail className="h-3 w-3" />}
                            {template.channels.includes('SMS') && <MessageSquare className="h-3 w-3" />}
                            {template.channels.includes('IN_APP') && <Bell className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات پیشرفته</CardTitle>
              <CardDescription>
                تنظیمات پیشرفته سیستم اعلان‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">تنظیمات ارسال</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>بازه زمانی بررسی موجودی</Label>
                      <Select defaultValue="HOURLY">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MINUTELY">هر دقیقه</SelectItem>
                          <SelectItem value="HOURLY">هر ساعت</SelectItem>
                          <SelectItem value="DAILY">هر روز</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>حداکثر تعداد اعلان روزانه</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">تنظیمات ایمیل</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>SMTP سرور</Label>
                      <Input placeholder="smtp.example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>پورت</Label>
                        <Input type="number" defaultValue="587" />
                      </div>
                      <div>
                        <Label>نوع امنیت</Label>
                        <Select defaultValue="TLS">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TLS">TLS</SelectItem>
                            <SelectItem value="SSL">SSL</SelectItem>
                            <SelectItem value="NONE">هیچکدام</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">تنظیمات پیامک</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>API Key</Label>
                      <Input type="password" placeholder="Enter your SMS API key" />
                    </div>
                    <div>
                      <Label>شماره فرستنده</Label>
                      <Input placeholder="5000123456" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}