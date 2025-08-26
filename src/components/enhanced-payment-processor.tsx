"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Wifi, 
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  Printer,
  Camera,
  Car,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  ArrowRight
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { PaymentMethod } from "@/lib/payment-service";

interface VehicleSession {
  id: string;
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  vehicleType: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  entryImage?: string;
  exitImage?: string;
  croppedPlateImage?: string;
  lotName?: string;
  duration?: number;
}

interface PaymentProcessorProps {
  session: VehicleSession;
  onComplete: (paymentResult: any) => void;
  onCancel: () => void;
}

interface POSStatus {
  isConnected: boolean;
  lastTransaction?: Date;
  pendingTransactions: number;
  totalAmount: number;
  error?: string;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  receipt?: string;
  message: string;
}

export function EnhancedPaymentProcessor({ session, onComplete, onCancel }: PaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState(session.totalAmount - session.paidAmount);
  const [cardNumber, setCardNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [posStatus, setPosStatus] = useState<POSStatus | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(session.totalAmount);

  // Load POS status
  useEffect(() => {
    loadPOSStatus();
    const interval = setInterval(loadPOSStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate real-time amount
  useEffect(() => {
    if (session.entryTime) {
      const now = new Date();
      const durationMs = now.getTime() - session.entryTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      
      // Simple calculation: base fee + hourly rate
      const baseFee = 5000; // 5,000 tomans base fee
      const hourlyRate = 3000; // 3,000 tomans per hour
      const calculatedTotal = baseFee + (durationHours * hourlyRate);
      
      // Round to nearest 1000
      setCalculatedAmount(Math.round(calculatedTotal / 1000) * 1000);
      
      if (amount === session.totalAmount) {
        setAmount(Math.max(0, calculatedTotal - session.paidAmount));
      }
    }
  }, [session.entryTime, session.totalAmount, session.paidAmount, amount]);

  const loadPOSStatus = async () => {
    try {
      const response = await fetch('/api/pos/status');
      const status = await response.json();
      setPosStatus(status);
    } catch (error) {
      console.error('Error loading POS status:', error);
    }
  };

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      setError('مبلغ پرداخت را وارد کنید');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          amount,
          paymentMethod: selectedMethod,
          cardNumber: selectedMethod === PaymentMethod.CARD ? cardNumber : undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const paymentResult: PaymentResult = {
          success: true,
          paymentId: result.payment.id,
          amount: result.payment.amount,
          method: result.payment.paymentMethod,
          transactionId: result.payment.transactionId,
          receipt: result.payment.receiptData,
          message: 'پرداخت با موفقیت انجام شد'
        };
        
        setPaymentResult(paymentResult);
        onComplete(paymentResult);
      } else {
        setError(result.error || 'خطا در پردازش پرداخت');
      }
    } catch (error) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <DollarSign className="h-5 w-5" />;
      case PaymentMethod.CARD:
        return <CreditCard className="h-5 w-5" />;
      case PaymentMethod.POS:
        return <Smartphone className="h-5 w-5" />;
      case PaymentMethod.ONLINE:
        return <Wifi className="h-5 w-5" />;
      case PaymentMethod.CREDIT:
        return <CreditCard className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      [PaymentMethod.CASH]: 'نقدی',
      [PaymentMethod.CARD]: 'کارت',
      [PaymentMethod.POS]: 'POS',
      [PaymentMethod.ONLINE]: 'آنلاین',
      [PaymentMethod.CREDIT]: 'اعتباری'
    };
    return labels[method];
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const getDuration = () => {
    if (!session.entryTime) return 0;
    const now = new Date();
    const durationMs = now.getTime() - session.entryTime.getTime();
    return Math.floor(durationMs / (1000 * 60)); // minutes
  };

  const remainingAmount = Math.max(0, calculatedAmount - session.paidAmount);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">پرداخت هزینه خروج خودرو</h2>
        <Button variant="outline" onClick={onCancel}>
          انصراف
        </Button>
      </div>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment">پرداخت</TabsTrigger>
          <TabsTrigger value="details">جزئیات</TabsTrigger>
          <TabsTrigger value="images">تصاویر</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          {/* Vehicle and Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                اطلاعات خودرو و جلسه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Label className="text-xs text-gray-600">پلاک خودرو</Label>
                  <p className="text-lg font-bold">{session.plateNumber}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Label className="text-xs text-gray-600">مدت اقامت</Label>
                  <p className="text-lg font-bold">{toPersianNumerals(getDuration())} دقیقه</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Label className="text-xs text-gray-600">نوع وسیله</Label>
                  <p className="font-semibold">{session.vehicleType === 'CAR' ? 'خودرو' : session.vehicleType}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Label className="text-xs text-gray-600">محل پارک</Label>
                  <p className="font-semibold">{session.lotName || 'نامشخص'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <Label className="text-xs text-gray-600">مبلغ کل</Label>
                  <p className="text-xl font-bold">{toPersianNumerals(calculatedAmount.toLocaleString())} تومان</p>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-gray-600">پرداخت شده</Label>
                  <p className="text-xl font-bold text-green-600">{toPersianNumerals(session.paidAmount.toLocaleString())} تومان</p>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-gray-600">باقیمانده</Label>
                  <p className="text-2xl font-bold text-red-600">{toPersianNumerals(remainingAmount.toLocaleString())} تومان</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* POS Status */}
          {selectedMethod === PaymentMethod.POS && posStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {posStatus.isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
                  وضعیت دستگاه POS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Label className="text-xs text-gray-600">وضعیت اتصال</Label>
                    <Badge variant={posStatus.isConnected ? 'default' : 'destructive'} className="mt-1">
                      {posStatus.isConnected ? 'متصل' : 'قطع'}
                    </Badge>
                  </div>
                  {posStatus.lastTransaction && (
                    <div className="text-center">
                      <Label className="text-xs text-gray-600">آخرین تراکنش</Label>
                      <p className="text-sm">{formatPersianDate(posStatus.lastTransaction, 'HH:mm:ss')}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <Label className="text-xs text-gray-600">تراکنش‌های در انتظار</Label>
                    <p className="text-lg font-semibold">{posStatus.pendingTransactions}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-xs text-gray-600">مجموع مبلغ</Label>
                    <p className="text-lg font-semibold">{toPersianNumerals(posStatus.totalAmount.toLocaleString())} تومان</p>
                  </div>
                </div>
                {posStatus.error && (
                  <Alert className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{posStatus.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>روش پرداخت</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.values(PaymentMethod).map((method) => (
                    <Button
                      key={method}
                      variant={selectedMethod === method ? "default" : "outline"}
                      onClick={() => setSelectedMethod(method)}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      disabled={isProcessing}
                    >
                      {getPaymentMethodIcon(method)}
                      <span className="text-sm">{getPaymentMethodLabel(method)}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Amount Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">مبلغ پرداخت (تومان)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      disabled={isProcessing}
                      className="text-lg text-center"
                      min="1"
                      max={remainingAmount}
                    />
                    <p className="text-sm text-gray-600 text-center">
                      حداکثر: {toPersianNumerals(remainingAmount.toLocaleString())} تومان
                    </p>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-4">
                  {(selectedMethod === PaymentMethod.CARD || selectedMethod === PaymentMethod.POS) && (
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">شماره کارت (اختیاری)</Label>
                      <Input
                        id="cardNumber"
                        value={formatCardNumber(cardNumber)}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        disabled={isProcessing}
                      />
                    </div>
                  )}
                </div>

                {/* Actions and Status */}
                <div className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {paymentResult && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {paymentResult.message}
                        {paymentResult.receipt && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-line">
                            {paymentResult.receipt}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing || !amount || amount <= 0}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 ml-2 animate-spin" />
                          در حال پردازش...
                        </>
                      ) : (
                        <>
                          {getPaymentMethodIcon(selectedMethod)}
                          پرداخت {getPaymentMethodLabel(selectedMethod)}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                    
                    {paymentResult && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (paymentResult.receipt) {
                            window.print();
                          }
                        }}
                        className="w-full"
                      >
                        <Printer className="h-4 w-4 ml-2" />
                        چاپ رسید
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جزئیات کامل جلسه پارکینگ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">شناسه جلسه</Label>
                  <p className="font-mono text-sm">{session.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">پلاک خودرو</Label>
                  <p className="font-semibold">{session.plateNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">زمان ورود</Label>
                  <p className="font-semibold">{formatPersianDate(session.entryTime)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">مدت اقامت</Label>
                  <p className="font-semibold">{toPersianNumerals(getDuration())} دقیقه</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">نوع وسیله نقلیه</Label>
                  <p className="font-semibold">{session.vehicleType === 'CAR' ? 'خودرو سواری' : session.vehicleType}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">محل پارک</Label>
                  <p className="font-semibold">{session.lotName || 'نامشخص'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">وضعیت</Label>
                  <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {session.status === 'ACTIVE' ? 'فعال' : 'تکمیل شده'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">محاسبه خودکار</Label>
                  <p className="font-semibold text-green-600">فعال</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">محاسبه هزینه</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>هزینه ورودیه:</span>
                    <span>{toPersianNumerals((5000).toLocaleString())} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه ساعتی:</span>
                    <span>{toPersianNumerals((3000).toLocaleString())} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مدت اقامت:</span>
                    <span>{toPersianNumerals(getDuration())} دقیقه ({toPersianNumerals((getDuration() / 60).toFixed(1))} ساعت)</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>مجموع:</span>
                    <span className="text-lg">{toPersianNumerals(calculatedAmount.toLocaleString())} تومان</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                تصاویر ثبت شده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entry Image */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">تصویر ورود</Label>
                  <div className="border rounded-lg overflow-hidden bg-gray-100">
                    {session.entryImage ? (
                      <img 
                        src={session.entryImage} 
                        alt="تصویر ورود خودرو"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p>تصویری موجود نیست</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPersianDate(session.entryTime)}
                  </p>
                </div>

                {/* Cropped Plate Image */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">پلاک شناسایی شده</Label>
                  <div className="border rounded-lg overflow-hidden bg-gray-100">
                    {session.croppedPlateImage ? (
                      <img 
                        src={session.croppedPlateImage} 
                        alt="پلاک شناسایی شده"
                        className="w-full h-48 object-contain"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p>پلاکی شناسایی نشده</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    پلاک: {session.plateNumber}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowImageComparison(true)}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  مقایسه تصاویر
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Comparison Dialog */}
      <Dialog open={showImageComparison} onOpenChange={setShowImageComparison}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>مقایسه تصاویر ورود و خروج</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">تصویر ورود</h4>
              <div className="border rounded-lg overflow-hidden">
                {session.entryImage ? (
                  <img 
                    src={session.entryImage} 
                    alt="تصویر ورود"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-500">
                    تصویری موجود نیست
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                زمان: {formatPersianDate(session.entryTime)}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">تصویر فعلی (خروج)</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">دوربین خروج فعال</p>
                    <p className="text-sm text-gray-400">در حال انتظار تصویر...</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                زمان: {formatPersianDate(new Date())}
              </p>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              لطفاً مطمئن شوید که خودروی خروجی با خودروی ورودی یکی است. در صورت تفاوت، با مدیر سیستم تماس بگیرید.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    </div>
  );
}