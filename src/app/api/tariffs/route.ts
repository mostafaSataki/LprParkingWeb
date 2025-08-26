import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = searchParams.get('vehicleType');
    const isActive = searchParams.get('isActive');

    let whereClause: any = {};
    
    if (vehicleType) {
      whereClause.vehicleType = vehicleType;
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const tariffs = await db.tariff.findMany({
      where: whereClause,
      orderBy: [
        { isHolidayRate: 'desc' },
        { isWeekendRate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(tariffs);
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تعرفه‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!name || !vehicleType || hourlyRate === undefined) {
      return NextResponse.json(
        { error: 'فیلدهای الزامی را تکمیل کنید' },
        { status: 400 }
      );
    }

    const tariff = await db.tariff.create({
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

    return NextResponse.json(tariff, { status: 201 });
  } catch (error) {
    console.error('Error creating tariff:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تعرفه' },
      { status: 500 }
    );
  }
}