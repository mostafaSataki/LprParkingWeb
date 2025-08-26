import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/shifts - Get all shifts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');
    const operatorId = searchParams.get('operatorId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }

    const [shifts, total] = await Promise.all([
      db.shift.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              sessions: true,
              payments: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit
      }),
      db.shift.count({ where })
    ]);

    return NextResponse.json({
      shifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات شیفت‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create new shift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startTime, operatorId } = body;

    // Validate required fields
    if (!name || !startTime || !operatorId) {
      return NextResponse.json(
        { error: 'نام، زمان شروع و اپراتور الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if operator exists
    const operator = await db.user.findUnique({
      where: { id: operatorId }
    });

    if (!operator) {
      return NextResponse.json(
        { error: 'اپراتور مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if operator has an active shift
    const activeShift = await db.shift.findFirst({
      where: {
        operatorId,
        isActive: true,
        endTime: null
      }
    });

    if (activeShift) {
      return NextResponse.json(
        { error: 'این اپراتور در حال حاضر شیفت فعال دارد' },
        { status: 400 }
      );
    }

    const shift = await db.shift.create({
      data: {
        name,
        startTime: new Date(startTime),
        operatorId
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد شیفت جدید' },
      { status: 500 }
    );
  }
}