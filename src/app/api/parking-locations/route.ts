import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a parking location
const createLocationSchema = z.object({
  name: z.string().min(1, 'نام محل الزامی است'),
  description: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Validation schema for updating a parking location
const updateLocationSchema = createLocationSchema.partial();

// GET /api/parking-locations - List parking locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const locations = await db.parkingLocation.findMany({
      where,
      include: {
        cameras: {
          select: {
            id: true,
            name: true,
            type: true,
            direction: true,
            isActive: true,
          },
        },
        parkingLots: {
          select: {
            id: true,
            name: true,
            totalCapacity: true,
            occupiedSpaces: true,
            floorNumber: true,
            section: true,
            isActive: true,
          },
        },
        doors: {
          include: {
            door: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            cameras: true,
            parkingLots: true,
            doors: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching parking locations:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست محل‌های پارکینگ' },
      { status: 500 }
    );
  }
}

// POST /api/parking-locations - Create new parking location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // Check if location name already exists
    const existingLocation = await db.parkingLocation.findFirst({
      where: {
        name: validatedData.name,
      },
    });

    if (existingLocation) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ با این نام وجود دارد' },
        { status: 400 }
      );
    }

    // Create the parking location
    const location = await db.parkingLocation.create({
      data: validatedData,
      include: {
        cameras: true,
        parkingLots: true,
        doors: {
          include: {
            door: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: location,
      message: 'محل پارکینگ با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating parking location:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد محل پارکینگ' },
      { status: 500 }
    );
  }
}