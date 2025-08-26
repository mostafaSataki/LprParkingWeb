import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tariff = await db.tariff.findUnique({
      where: { id: params.id },
      include: {
        holidayRules: {
          include: {
            holiday: true
          }
        }
      }
    });

    if (!tariff) {
      return NextResponse.json(
        { error: 'تعرفه یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(tariff);
  } catch (error) {
    console.error('Error fetching tariff:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تعرفه' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      vehicleType,
      entranceFee,
      freeMinutes,
      hourlyRate,
      dailyRate,
      nightlyRate,
      dailyCap,
      nightlyCap,
      weeklyCap,
      monthlyCap,
      isActive,
      isHolidayRate,
      isWeekendRate,
      validFrom,
      validTo
    } = body;

    const tariff = await db.tariff.update({
      where: { id: params.id },
      data: {
        name,
        description,
        vehicleType,
        entranceFee: entranceFee || 0,
        freeMinutes: freeMinutes || 15,
        hourlyRate,
        dailyRate,
        nightlyRate,
        dailyCap,
        nightlyCap,
        weeklyCap,
        monthlyCap,
        isActive: isActive ?? true,
        isHolidayRate: isHolidayRate ?? false,
        isWeekendRate: isWeekendRate ?? false,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null
      }
    });

    return NextResponse.json(tariff);
  } catch (error) {
    console.error('Error updating tariff:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی تعرفه' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.tariff.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'تعرفه با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting tariff:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تعرفه' },
      { status: 500 }
    );
  }
}