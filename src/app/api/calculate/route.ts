import { NextRequest, NextResponse } from 'next/server';
import { TariffCalculator } from '@/lib/tariff-calculator';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      entryTime,
      exitTime,
      vehicleType,
      plateNumber
    } = body;

    // Validate required fields
    if (!entryTime || !exitTime || !vehicleType || !plateNumber) {
      return NextResponse.json(
        { error: 'فیلدهای الزامی را تکمیل کنید' },
        { status: 400 }
      );
    }

    // Get all tariffs and holidays
    const [tariffs, holidays] = await Promise.all([
      db.tariff.findMany({
        where: { isActive: true },
        orderBy: [
          { isHolidayRate: 'desc' },
          { isWeekendRate: 'desc' }
        ]
      }),
      db.holiday.findMany({
        where: { isActive: true }
      })
    ]);

    // Get applicable tariff
    const entryDate = new Date(entryTime);
    const applicableTariff = await TariffCalculator.getApplicableTariff(
      entryDate,
      vehicleType,
      tariffs,
      holidays
    );

    if (!applicableTariff) {
      return NextResponse.json(
        { error: 'تعرفه‌ای برای این نوع وسیله نقلیه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if entry time is holiday or weekend
    const isHoliday = await TariffCalculator.isHoliday(entryDate, holidays);
    const isWeekend = TariffCalculator.isWeekend(entryDate);

    // Calculate the cost
    const calculation = TariffCalculator.calculate({
      entryTime: new Date(entryTime),
      exitTime: new Date(exitTime),
      vehicleType,
      tariff: applicableTariff,
      isHoliday,
      isWeekend
    });

    // Generate receipt data
    const receiptData = TariffCalculator.generateReceipt(calculation, {
      entryTime: new Date(entryTime),
      exitTime: new Date(exitTime),
      plateNumber
    });

    return NextResponse.json({
      calculation,
      tariff: applicableTariff,
      receipt: receiptData,
      appliedRules: calculation.appliedRules
    });

  } catch (error) {
    console.error('Error calculating tariff:', error);
    return NextResponse.json(
      { error: 'خطا در محاسبه هزینه' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryTime = searchParams.get('entryTime');
    const estimatedDuration = searchParams.get('estimatedDuration'); // in minutes
    const vehicleType = searchParams.get('vehicleType');

    if (!entryTime || !estimatedDuration || !vehicleType) {
      return NextResponse.json(
        { error: 'پارامترهای الزامی را وارد کنید' },
        { status: 400 }
      );
    }

    // Calculate estimated exit time
    const entryDate = new Date(entryTime);
    const estimatedExitTime = new Date(entryDate.getTime() + parseInt(estimatedDuration) * 60000);

    // Get all tariffs and holidays
    const [tariffs, holidays] = await Promise.all([
      db.tariff.findMany({
        where: { isActive: true },
        orderBy: [
          { isHolidayRate: 'desc' },
          { isWeekendRate: 'desc' }
        ]
      }),
      db.holiday.findMany({
        where: { isActive: true }
      })
    ]);

    // Get estimated cost
    const estimate = await TariffCalculator.estimateCost(
      entryDate,
      estimatedExitTime,
      vehicleType,
      tariffs,
      holidays
    );

    return NextResponse.json({
      estimatedAmount: estimate.estimatedAmount,
      currency: estimate.currency,
      estimatedExitTime: estimatedExitTime.toISOString(),
      estimatedDuration: parseInt(estimatedDuration)
    });

  } catch (error) {
    console.error('Error estimating cost:', error);
    return NextResponse.json(
      { error: 'خطا در برآورد هزینه' },
      { status: 500 }
    );
  }
}