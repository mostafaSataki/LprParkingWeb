import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    let whereClause: any = {};
    
    if (year) {
      // Filter holidays for the specified year
      const startDate = new Date(parseInt(year) - 621, 0, 1);
      const endDate = new Date(parseInt(year) - 621 + 1, 0, 1);
      
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const holidays = await db.holiday.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تعطیلات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      date,
      isRecurring = false,
      type = 'OFFICIAL',
      description
    } = body;

    // Validate required fields
    if (!name || !date) {
      return NextResponse.json(
        { error: 'نام و تاریخ تعطیلی الزامی است' },
        { status: 400 }
      );
    }

    // Check if holiday already exists for this date
    const existingHoliday = await db.holiday.findFirst({
      where: {
        date: new Date(date),
        type: { not: 'FRIDAY' } // Don't check for Friday holidays
      }
    });

    if (existingHoliday) {
      return NextResponse.json(
        { error: 'تعطیلی برای این تاریخ قبلاً تعریف شده است' },
        { status: 400 }
      );
    }

    // Create holiday
    const holiday = await db.holiday.create({
      data: {
        name,
        date: new Date(date),
        isRecurring,
        type,
        description,
        isActive: true
      }
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تعطیلی' },
      { status: 500 }
    );
  }
}