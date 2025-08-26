import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    const paymentService = PaymentService.getInstance();
    const status = await paymentService.getPOSStatus(deviceId || undefined);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting POS status:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت POS' },
      { status: 500 }
    );
  }
}