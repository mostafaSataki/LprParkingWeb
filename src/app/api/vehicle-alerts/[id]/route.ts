import { NextRequest, NextResponse } from 'next/server';
import { VehicleAlertService } from '@/lib/vehicle-alerts';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    const body = await request.json();

    const updatedAlert = await VehicleAlertService.updateAlert(alertId, body);

    if (!updatedAlert) {
      return NextResponse.json(
        { success: false, error: 'هشدار یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        alert: updatedAlert,
        message: 'هشدار با موفقیت بروزرسانی شد'
      }
    });

  } catch (error) {
    console.error('Vehicle alert update error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی هشدار' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    
    const deleted = await VehicleAlertService.deleteAlert(alertId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'هشدار یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'هشدار با موفقیت حذف شد'
      }
    });

  } catch (error) {
    console.error('Vehicle alert delete error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف هشدار' },
      { status: 500 }
    );
  }
}