import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { smsService } from '@/lib/sms-service';
import { z } from 'zod';

// Validation schema for SMS request
const smsSchema = z.object({
  type: z.enum(['RESERVATION_CONFIRMATION', 'REMINDER_24H', 'REMINDER_1H', 'CANCELLATION', 'COMPLETION', 'PAYMENT_RECEIVED', 'GATE_ACCESS_CODE']),
  customMessage: z.string().optional(),
  accessCode: z.string().optional(),
  refundAmount: z.number().optional(),
});

// POST /api/reservations/[id]/sms - Send SMS notification for reservation
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;
    const body = await request.json();
    const validatedData = smsSchema.parse(body);

    // Get reservation details
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: true,
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

    if (!reservation.customerPhone) {
      return NextResponse.json(
        { success: false, error: 'شماره تلفن مشتری ثبت نشده است' },
        { status: 400 }
      );
    }

    let smsResponse;
    let smsType;

    // Send appropriate SMS based on type
    switch (validatedData.type) {
      case 'RESERVATION_CONFIRMATION':
        smsResponse = await smsService.sendReservationConfirmation({
          ...reservation,
          locationName: reservation.location.name,
          lotName: reservation.lot.name,
        });
        smsType = 'RESERVATION_CONFIRMATION';
        break;

      case 'REMINDER_24H':
        smsResponse = await smsService.sendReminder24h({
          ...reservation,
          locationName: reservation.location.name,
          lotName: reservation.lot.name,
        });
        smsType = 'REMINDER_24H';
        break;

      case 'REMINDER_1H':
        smsResponse = await smsService.sendReminder1h({
          ...reservation,
          locationName: reservation.location.name,
          lotName: reservation.lot.name,
        });
        smsType = 'REMINDER_1H';
        break;

      case 'CANCELLATION':
        smsResponse = await smsService.sendCancellationSMS(
          {
            ...reservation,
            locationName: reservation.location.name,
            lotName: reservation.lot.name,
          },
          validatedData.refundAmount
        );
        smsType = 'CANCELLATION';
        break;

      case 'COMPLETION':
        smsResponse = await smsService.sendCompletionSMS({
          ...reservation,
          locationName: reservation.location.name,
          lotName: reservation.lot.name,
        });
        smsType = 'COMPLETION';
        break;

      case 'PAYMENT_RECEIVED':
        // Get the latest payment for this reservation
        const latestPayment = await db.reservationPayment.findFirst({
          where: { reservationId },
          orderBy: { createdAt: 'desc' },
        });

        if (!latestPayment) {
          return NextResponse.json(
            { success: false, error: 'هیچ پرداختی برای این رزرو یافت نشد' },
            { status: 404 }
          );
        }

        smsResponse = await smsService.sendPaymentReceivedSMS(
          {
            ...reservation,
            locationName: reservation.location.name,
            lotName: reservation.lot.name,
          },
          latestPayment
        );
        smsType = 'PAYMENT_RECEIVED';
        break;

      case 'GATE_ACCESS_CODE':
        if (!validatedData.accessCode) {
          return NextResponse.json(
            { success: false, error: 'کد دسترسی الزامی است' },
            { status: 400 }
          );
        }

        smsResponse = await smsService.sendGateAccessCode(
          {
            ...reservation,
            locationName: reservation.location.name,
            lotName: reservation.lot.name,
          },
          validatedData.accessCode
        );
        smsType = 'GATE_ACCESS_CODE';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع پیامک نامعتبر است' },
          { status: 400 }
        );
    }

    // Save SMS record to database
    if (smsResponse.success) {
      await db.reservationSMS.create({
        data: {
          reservationId,
          phoneNumber: reservation.customerPhone,
          message: validatedData.customMessage || '', // Would be populated from SMS service
          type: smsType,
          status: 'SENT',
          smsId: smsResponse.messageId,
          sentAt: new Date(),
        },
      });

      // Update reservation SMS sent flag
      await db.reservation.update({
        where: { id: reservationId },
        data: { smsSent: true },
      });
    } else {
      // Save failed SMS record
      await db.reservationSMS.create({
        data: {
          reservationId,
          phoneNumber: reservation.customerPhone,
          message: validatedData.customMessage || '',
          type: smsType,
          status: 'FAILED',
          error: smsResponse.errorMessage,
        },
      });
    }

    return NextResponse.json({
      success: smsResponse.success,
      data: {
        messageId: smsResponse.messageId,
        type: validatedData.type,
        phoneNumber: reservation.customerPhone,
      },
      message: smsResponse.success ? 'پیامک با موفقیت ارسال شد' : 'خطا در ارسال پیامک',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال پیامک' },
      { status: 500 }
    );
  }
}

// GET /api/reservations/[id]/sms - Get SMS history for reservation
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;

    const smsHistory = await db.reservationSMS.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: smsHistory,
    });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تاریخچه پیامک‌ها' },
      { status: 500 }
    );
  }
}