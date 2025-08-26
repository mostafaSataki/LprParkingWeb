import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/vehicles - Get all vehicles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerPhone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: {
          _count: {
            select: {
              sessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.vehicle.count({ where })
    ]);

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات خودروها' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plateNumber, vehicleType = 'CAR', ownerName, ownerPhone, isAllowed = true, notes } = body;

    // Validate required fields
    if (!plateNumber) {
      return NextResponse.json(
        { error: 'پلاک خودرو الزامی است' },
        { status: 400 }
      );
    }

    // Check if vehicle already exists
    const existingVehicle = await db.vehicle.findUnique({
      where: { plateNumber }
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'خودرو با این پلاک قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    const vehicle = await db.vehicle.create({
      data: {
        plateNumber: plateNumber.trim(),
        vehicleType,
        ownerName,
        ownerPhone,
        isAllowed,
        isBlacklisted: false,
        notes
      }
    });

    return NextResponse.json({
      message: 'خرو با موفقیت ثبت شد',
      vehicle
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت خودرو' },
      { status: 500 }
    );
  }
}