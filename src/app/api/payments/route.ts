import { NextRequest, NextResponse } from 'next/server';
import { PaymentService, PaymentMethod } from '@/lib/payment-service';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');
    const method = searchParams.get('method');

    let whereClause: any = {};
    
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (method) {
      whereClause.paymentMethod = method;
    }

    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            plateNumber: true,
            entryTime: true,
            exitTime: true,
            vehicleType: true
          }
        },
        operator: {
          select: {
            name: true,
            username: true
          }
        },
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پرداخت‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      sessionId,
      amount,
      paymentMethod,
      operatorId,
      shiftId,
      cardNumber,
      transactionId
    } = body;

    // Validate required fields
    if (!sessionId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'فیلدهای الزامی را تکمیل کنید' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const session = await db.parkingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'جلسه پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'جلسه پارکینگ فعال نیست' },
        { status: 400 }
      );
    }

    // Process payment
    const paymentService = PaymentService.getInstance();
    const paymentResult = await paymentService.processPayment({
      sessionId,
      amount,
      paymentMethod: paymentMethod as PaymentMethod,
      operatorId,
      shiftId,
      cardNumber,
      transactionId
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.message },
        { status: 400 }
      );
    }

    // Save payment to database
    const payment = await db.payment.create({
      data: {
        sessionId,
        amount,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionId: paymentResult.transactionId,
        operatorId,
        shiftId,
        status: 'COMPLETED',
        receiptNumber: paymentResult.receiptNumber,
        receiptData: paymentResult.receiptData
      }
    });

    // Update session
    await db.parkingSession.update({
      where: { id: sessionId },
      data: {
        paidAmount: session.paidAmount + amount,
        isPaid: (session.paidAmount + amount) >= session.totalAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        status: (session.paidAmount + amount) >= session.totalAmount ? 'COMPLETED' : 'ACTIVE'
      }
    });

    // Create session event
    await db.sessionEvent.create({
      data: {
        sessionId,
        eventType: 'PAYMENT_RECEIVED',
        eventData: JSON.stringify({
          paymentId: payment.id,
          amount,
          method: paymentMethod,
          receiptNumber: paymentResult.receiptNumber
        })
      }
    });

    return NextResponse.json({
      payment,
      receipt: paymentResult.receiptData,
      message: paymentResult.message
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش پرداخت' },
      { status: 500 }
    );
  }
}