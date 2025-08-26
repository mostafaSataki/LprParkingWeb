import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentGateway } from '@/lib/payment-gateway';
import { z } from 'zod';

// Validation schema for payment request
const paymentSchema = z.object({
  amount: z.number().positive('مبلغ باید مثبت باشد'),
  paymentMethod: z.enum(['CASH', 'CARD', 'POS', 'ONLINE', 'CREDIT']),
  description: z.string().optional(),
});

// GET /api/reservations/[id]/payment - Get payment info for reservation
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;

    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
        lot: true,
        location: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'رزرو مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reservation,
        totalPaid: reservation.payments.reduce((sum, payment) => sum + payment.amount, 0),
        remainingAmount: reservation.totalAmount - reservation.payments.reduce((sum, payment) => sum + payment.amount, 0),
        isFullyPaid: reservation.totalAmount <= reservation.payments.reduce((sum, payment) => sum + payment.amount, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching reservation payment info:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات پرداخت' },
      { status: 500 }
    );
  }
}

// POST /api/reservations/[id]/payment - Process payment for reservation
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Get reservation details
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        payments: true,
        customer: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'رزرو مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if reservation is still valid for payment
    if (reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'این رزرو قابل پرداخت نیست' },
        { status: 400 }
      );
    }

    // Calculate remaining amount
    const totalPaid = reservation.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = reservation.totalAmount - totalPaid;

    if (remainingAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'این رزرو قبلاً پرداخت شده است' },
        { status: 400 }
      );
    }

    // Validate payment amount
    if (validatedData.amount > remainingAmount) {
      return NextResponse.json(
        { success: false, error: `مبلغ پرداخت نمی‌تواند بیشتر از ${remainingAmount} تومان باشد` },
        { status: 400 }
      );
    }

    let paymentRecord;
    const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (validatedData.paymentMethod === 'ONLINE') {
      // Process online payment
      const paymentRequest = {
        amount: validatedData.amount,
        orderId: reservation.reservationCode,
        description: validatedData.description || `پرداخت رزرو پارکینگ ${reservation.reservationCode}`,
        mobile: reservation.customerPhone,
        email: reservation.customerEmail,
        callbackUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/reservations/${reservationId}/payment/callback`,
      };

      const paymentResult = await paymentGateway.requestPayment(paymentRequest);

      if (!paymentResult.success) {
        return NextResponse.json(
          { success: false, error: paymentResult.errorMessage || 'خطا در اتصال به درگاه پرداخت' },
          { status: 400 }
        );
      }

      // Create pending payment record
      paymentRecord = await db.reservationPayment.create({
        data: {
          reservationId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          transactionId,
          status: 'PENDING',
          gatewayResponse: JSON.stringify({
            authority: paymentResult.authority,
            paymentUrl: paymentResult.paymentUrl,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          payment: paymentRecord,
          paymentUrl: paymentResult.paymentUrl,
          authority: paymentResult.authority,
          message: 'لطفاً برای پرداخت به درگاه منتقل شوید',
        },
      });
    } else {
      // Process offline payment (CASH, CARD, POS, CREDIT)
      paymentRecord = await db.reservationPayment.create({
        data: {
          reservationId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          transactionId,
          status: 'COMPLETED',
          receiptNumber: `RCT-${Date.now()}`,
        },
      });

      // Update reservation payment status
      const newTotalPaid = totalPaid + validatedData.amount;
      const isFullyPaid = newTotalPaid >= reservation.totalAmount;

      await db.reservation.update({
        where: { id: reservationId },
        data: {
          paidAmount: newTotalPaid,
          isPaid: isFullyPaid,
          status: isFullyPaid ? 'CONFIRMED' : reservation.status,
        },
      });

      // If spot was reserved, update its status when payment is complete
      if (reservation.spotId && isFullyPaid) {
        await db.parkingSpot.update({
          where: { id: reservation.spotId },
          data: { status: 'RESERVED' },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          payment: paymentRecord,
          message: 'پرداخت با موفقیت ثبت شد',
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش پرداخت' },
      { status: 500 }
    );
  }
}