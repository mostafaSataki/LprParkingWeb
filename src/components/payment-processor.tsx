"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersianNumeralsInput } from "@/components/ui/persian-date-picker";
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
  Printer
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { PaymentMethod, PaymentStatus } from "@/lib/payment-service";

interface PaymentProcessorProps {
  session: {
    id: string;
    plateNumber: string;
    entryTime: Date;
    vehicleType: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  };
  onPaymentComplete: (paymentResult: any) => void;
}

interface POSStatus {
  isConnected: boolean;
  lastTransaction?: Date;
  pendingTransactions: number;
  totalAmount: number;
  error?: string;
}

export function PaymentProcessor({ session, onPaymentComplete }: PaymentProcessorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState(session.totalAmount - session.paidAmount);
  const [cardNumber, setCardNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [posStatus, setPosStatus] = useState<POSStatus | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load POS status
  useEffect(() => {
    loadPOSStatus();
    const interval = setInterval(loadPOSStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
        setPaymentResult(result);
        onPaymentComplete(result.payment);
        
        // Reset form
        setCardNumber("");
        setAmount(session.totalAmount - session.paidAmount - amount);
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
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const remainingAmount = session.totalAmount - session.paidAmount;

  return (
    <div className="space-y-4">
      {/* Session Info - Horizontal Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            اطلاعات پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-gray-600">پلاک خودرو</Label>
              <p className="font-semibold text-sm">{session.plateNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">نوع وسیله</Label>
              <p className="font-semibold text-sm">{session.vehicleType === 'CAR' ? 'خودرو' : session.vehicleType}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">زمان ورود</Label>
              <p className="font-semibold text-sm">{formatPersianDate(session.entryTime, 'HH:mm')}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">وضعیت</Label>
              <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                {session.status === 'ACTIVE' ? 'فعال' : 'تکمیل شده'}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
            <div>
              <Label className="text-xs text-gray-600">مبلغ کل</Label>
              <p className="font-semibold text-sm">{toPersianNumerals(session.totalAmount.toLocaleString())} تومان</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">مبلغ پرداخت شده</Label>
              <p className="font-semibold text-sm text-green-600">{toPersianNumerals(session.paidAmount.toLocaleString())} تومان</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">مبلغ باقی‌مانده</Label>
              <p className="text-lg font-bold text-red-600">{toPersianNumerals(remainingAmount.toLocaleString())} تومان</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POS Status - Horizontal Layout */}
      {selectedMethod === PaymentMethod.POS && posStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {posStatus.isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              وضعیت دستگاه POS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-gray-600">وضعیت اتصال</Label>
                <Badge variant={posStatus.isConnected ? 'default' : 'destructive'} className="text-xs">
                  {posStatus.isConnected ? 'متصل' : 'قطع'}
                </Badge>
              </div>
              {posStatus.lastTransaction && (
                <div>
                  <Label className="text-xs text-gray-600">آخرین تراکنش</Label>
                  <p className="text-xs">{formatPersianDate(posStatus.lastTransaction, 'HH:mm:ss')}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-600">تراکنش‌های در انتظار</Label>
                <p className="text-xs font-semibold">{posStatus.pendingTransactions}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">مجموع مبلغ</Label>
                <p className="text-xs font-semibold">{toPersianNumerals(posStatus.totalAmount.toLocaleString())} تومان</p>
              </div>
            </div>
            {posStatus.error && (
              <Alert className="mt-2">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{posStatus.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Form - Horizontal Layout */}
      <Card>
        <CardHeader>
          <CardTitle>پرداخت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>روش پرداخت</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.values(PaymentMethod).map((method) => (
                <Button
                  key={method}
                  variant={selectedMethod === method ? "default" : "outline"}
                  onClick={() => setSelectedMethod(method)}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  disabled={isProcessing}
                >
                  {getPaymentMethodIcon(method)}
                  <span className="text-xs">{getPaymentMethodLabel(method)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Details - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Amount */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ پرداخت (تومان)</Label>
                <PersianNumeralsInput
                  id="amount"
                  value={amount}
                  onChange={(value) => setAmount(Number(value))}
                  disabled={isProcessing}
                  className="text-lg"
                />
                <p className="text-sm text-gray-600">
                  مبلغ باقی‌مانده: {toPersianNumerals(remainingAmount.toLocaleString())} تومان
                </p>
              </div>
            </div>

            {/* Middle Column - Card Info */}
            <div className="space-y-4">
              {/* Card Number Input (for card payments) */}
              {(selectedMethod === PaymentMethod.CARD || selectedMethod === PaymentMethod.POS) && (
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">شماره کارت</Label>
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

            {/* Right Column - Status and Actions */}
            <div className="space-y-4">
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Payment Result */}
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !amount || amount <= 0}
                  className="w-full"
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
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    // Print receipt logic would go here
                    if (paymentResult?.receipt) {
                      window.print();
                    }
                  }}
                  disabled={!paymentResult}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  چاپ رسید
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}