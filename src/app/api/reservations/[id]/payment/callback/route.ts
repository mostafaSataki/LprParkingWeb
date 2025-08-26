import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentGateway } from '@/lib/payment-gateway';

// GET /api/reservations/[id]/payment/callback - Handle payment gateway callback
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = params.id;
    const { searchParams } = new URL(request.url);
    
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');
    
    if (!authority || !status) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای نامعتبر' },
        { status: 400 }
      );
    }

    // Get the payment record
    const payment = await db.reservationPayment.findFirst({
      where: {
        reservationId,
        status: 'PENDING',
      },
      include: {
        reservation: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'پرداخت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    if (status === 'OK') {
      // Verify the payment with the gateway
      const verificationResult = await paymentGateway.verifyPayment({
        authority,
        amount: payment.amount,
      });

      if (verificationResult.success) {
        // Update payment record
        await db.reservationPayment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            receiptNumber: verificationResult.refId,
            gatewayResponse: JSON.stringify({
              authority,
              refId: verificationResult.refId,
              cardNumber: verificationResult.cardNumber,
            }),
          },
        });

        // Update reservation payment status
        const reservation = payment.reservation;
        const totalPaid = reservation.paidAmount + payment.amount;
        const isFullyPaid = totalPaid >= reservation.totalAmount;

        await db.reservation.update({
          where: { id: reservationId },
          data: {
            paidAmount: totalPaid,
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

        // Redirect to success page
        return NextResponse.redirect(
          `${process.env.BASE_URL || 'http://localhost:3000'}/reservations/${reservationId}/payment/success?refId=${verificationResult.refId}`
        );
      } else {
        // Payment verification failed
        await db.reservationPayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            gatewayResponse: JSON.stringify({
              authority,
              errorCode: verificationResult.errorCode,
              errorMessage: verificationResult.errorMessage,
            }),
          },
        });

        // Redirect to failure page
        return NextResponse.redirect(
          `${process.env.BASE_URL || 'http://localhost:3000'}/reservations/${reservationId}/payment/failed?error=${verificationResult.errorMessage}`
        );
      }
    } else {
      // Payment was cancelled or failed
      await db.reservationPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponse: JSON.stringify({
            authority,
            status: 'CANCELLED',
          }),
        },
      });

      // Redirect to failure page
      return NextResponse.redirect(
        `${process.env.BASE_URL || 'http://localhost:3000'}/reservations/${reservationId}/payment/cancelled`
      );
    }
  } catch (error) {
    console.error('Error in payment callback:', error);
    
    // Redirect to error page
    return NextResponse.redirect(
      `${process.env.BASE_URL || 'http://localhost:3000'}/reservations/${params.id}/payment/error`
    );
  }
}