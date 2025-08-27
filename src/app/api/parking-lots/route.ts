import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a parking lot
const createLotSchema = z.object({
  locationId: z.string().min(1, 'محل پارکینگ الزامی است'),
  name: z.string().min(1, 'نام طبقه الزامی است'),
  description: z.string().optional(),
  totalCapacity: z.number().min(1, 'ظرفیت کل باید بزرگتر از 0 باشد'),
  floorNumber: z.number().min(0, 'شماره طبقه نمی‌تواند منفی باشد'),
  section: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Validation schema for updating a parking lot
const updateLotSchema = createLotSchema.partial();

// GET /api/parking-lots - List parking lots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const isActive = searchParams.get('isActive');
    const floorNumber = searchParams.get('floorNumber');

    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (floorNumber) where.floorNumber = parseInt(floorNumber);

    const parkingLots = await db.parkingLot.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        parkingSpots: {
          select: {
            id: true,
            spotNumber: true,
            status: true,
            type: true,
          },
        },
        status: {
          select: {
            totalCapacity: true,
            occupiedSpaces: true,
            availableSpaces: true,
            lastUpdated: true,
          },
        },
        _count: {
          select: {
            parkingSpots: true,
            sessions: true,
          },
        },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { floorNumber: 'asc' },
        { section: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: parkingLots,
    });
  } catch (error) {
    console.error('Error fetching parking lots:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست طبقات پارکینگ' },
      { status: 500 }
    );
  }
}

// POST /api/parking-lots - Create new parking lot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLotSchema.parse(body);

    // Check if the location exists
    const location = await db.parkingLocation.findUnique({
      where: { id: validatedData.locationId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if lot name already exists in this location
    const existingLot = await db.parkingLot.findFirst({
      where: {
        locationId: validatedData.locationId,
        name: validatedData.name,
      },
    });

    if (existingLot) {
      return NextResponse.json(
        { success: false, error: 'طبقه با این نام در این محل پارکینگ وجود دارد' },
        { status: 400 }
      );
    }

    // Create the parking lot
    const parkingLot = await db.parkingLot.create({
      data: validatedData,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        parkingSpots: true,
        status: true,
      },
    });

    // Create parking status record
    await db.parkingStatus.create({
      data: {
        lotId: parkingLot.id,
        totalCapacity: validatedData.totalCapacity,
        occupiedSpaces: 0,
        availableSpaces: validatedData.totalCapacity,
      },
    });

    return NextResponse.json({
      success: true,
      data: parkingLot,
      message: 'طبقه پارکینگ با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating parking lot:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد طبقه پارکینگ' },
      { status: 500 }
    );
  }
}