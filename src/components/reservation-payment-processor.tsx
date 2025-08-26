"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Clock
} from "lucide-react";
import { toPersianNumerals } from "@/lib/utils";

interface PaymentProcessorProps {
  reservation: any;
  onPaymentComplete: () => void;
}

interface PaymentFormData {
  amount: number;
  paymentMethod: string;
  description: string;
}

const paymentMethods = [
  { value: 'ONLINE', label: 'پرداخت آنلاین', icon: CreditCard, color: 'bg-blue-100 text-blue-800' },
  { value: 'CARD', label: 'کارت خوان', icon: CreditCard, color: 'bg-green-100 text-green-800' },
  { value: 'POS', label: 'دستگاه POS', icon: Smartphone, color: 'bg-purple-100 text-purple-800' },
  { value: 'CASH', label: 'نقدی', icon: DollarSign, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CREDIT', label: 'اعتباری', icon: CreditCard, color: 'bg-orange-100 text-orange-800' },
];

function PaymentForm({ onSubmit, reservation }: { 
  onSubmit: (data: PaymentFormData) => void;
  reservation: any;
}) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: reservation.totalAmount - reservation.paidAmount,
    paymentMethod: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAmount = reservation.totalAmount - reservation.paidAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">مبلغ پرداخت (تومان)</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            min="1000"
            max={remainingAmount}
            required
          />
          <p className="text-sm text-gray-600 mt-1">
            حداکثر مبلغ قابل پرداخت: {toPersianNumerals(remainingAmount)} تومان
          </p>
        </div>
        <div>
          <Label htmlFor="paymentMethod">روش پرداخت</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب روش پرداخت" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">توضیحات (اختیاری)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="توضیحات additional..."
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={!formData.paymentMethod || formData.amount <= 0 || isSubmitting}
      >
        {isSubmitting ? 'در حال پردازش...' : 'پرداخت'}
      </Button>
    </form>
  );
}

export default function ReservationPaymentProcessor({ reservation, onPaymentComplete }: PaymentProcessorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const remainingAmount = reservation.totalAmount - reservation.paidAmount;
  const isFullyPaid = remainingAmount <= 0;

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    setProcessingPayment(true);
    
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setPaymentResult(result.data);
        
        // If online payment, redirect to payment gateway
        if (data.paymentMethod === 'ONLINE' && result.data.paymentUrl) {
          window.open(result.data.paymentUrl, '_blank');
        } else {
          // For offline payments, close dialog and refresh
          setTimeout(() => {
            setIsDialogOpen(false);
            onPaymentComplete();
          }, 2000);
        }
      } else {
        setPaymentResult({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        error: 'خطا در ارتباط با سرور',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'موفق';
      case 'PENDING': return 'در انتظار';
      case 'FAILED': return 'ناموفق';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const paymentMethod = paymentMethods.find(m => m.value === method);
    return paymentMethod ? paymentMethod.icon : CreditCard;
  };

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            خلاصه پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>مبلغ کل:</span>
            <span className="font-semibold">{toPersianNumerals(reservation.totalAmount)} تومان</span>
          </div>
          <div className="flex justify-between">
            <span>پرداخت شده:</span>
            <span className="font-semibold text-green-600">{toPersianNumerals(reservation.paidAmount)} تومان</span>
          </div>
          <div className="flex justify-between">
            <span>باقیمانده:</span>
            <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {toPersianNumerals(remainingAmount)} تومان
            </span>
          </div>
          <div className="flex justify-between">
            <span>وضعیت پرداخت:</span>
            <Badge className={isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {isFullyPaid ? 'پرداخت کامل' : 'پرداخت نشده'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {reservation.payments && reservation.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              تاریخچه پرداخت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservation.payments.map((payment: any) => {
                const Icon = getPaymentMethodIcon(payment.paymentMethod);
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{toPersianNumerals(payment.amount)} تومان</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                      {payment.receiptNumber && (
                        <p className="text-xs text-gray-600 mt-1">
                          #{payment.receiptNumber}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Action */}
      {!isFullyPaid && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <CreditCard className="h-4 w-4 ml-2" />
              پرداخت {toPersianNumerals(remainingAmount)} تومان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>پرداخت رزرو</DialogTitle>
            </DialogHeader>
            
            {paymentResult ? (
              <div className="space-y-4">
                {paymentResult.success ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {paymentResult.paymentUrl ? (
                        <div className="space-y-2">
                          <p>در حال انتقال به درگاه پرداخت...</p>
                          <Button 
                            onClick={() => window.open(paymentResult.paymentUrl, '_blank')}
                            className="w-full"
                          >
                            <ExternalLink className="h-4 w-4 ml-2" />
                            رفتن به درگاه پرداخت
                          </Button>
                        </div>
                      ) : (
                        <p>پرداخت با موفقیت ثبت شد</p>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {paymentResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <PaymentForm onSubmit={handlePaymentSubmit} reservation={reservation} />
            )}
          </DialogContent>
        </Dialog>
      )}

      {isFullyPaid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            این رزرو به صورت کامل پرداخت شده است
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}