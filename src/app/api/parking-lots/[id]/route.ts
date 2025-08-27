import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a parking lot
const updateLotSchema = z.object({
  name: z.string().min(1, 'نام طبقه الزامی است').optional(),
  description: z.string().optional(),
  totalCapacity: z.number().min(1, 'ظرفیت کل باید بزرگتر از 0 باشد').optional(),
  floorNumber: z.number().min(0, 'شماره طبقه نمی‌تواند منفی باشد').optional(),
  section: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/parking-lots/[id] - Get single parking lot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parkingLot = await db.parkingLot.findUnique({
      where: { id: params.id },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        parkingSpots: {
          orderBy: [
            { floorNumber: 'asc' },
            { section: 'asc' },
            { spotNumber: 'asc' },
          ],
        },
        status: true,
        sessions: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            plateNumber: true,
            entryTime: true,
            vehicleType: true,
          },
        },
        _count: {
          select: {
            parkingSpots: true,
            sessions: true,
          },
        },
      },
    });

    if (!parkingLot) {
      return NextResponse.json(
        { success: false, error: 'طبقه پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parkingLot,
    });
  } catch (error) {
    console.error('Error fetching parking lot:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات طبقه پارکینگ' },
      { status: 500 }
    );
  }
}

// PUT /api/parking-lots/[id] - Update parking lot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateLotSchema.parse(body);

    // Check if parking lot exists
    const existingLot = await db.parkingLot.findUnique({
      where: { id: params.id },
    });

    if (!existingLot) {
      return NextResponse.json(
        { success: false, error: 'طبقه پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if name is being changed and already exists in this location
    if (validatedData.name && validatedData.name !== existingLot.name) {
      const nameExists = await db.parkingLot.findFirst({
        where: {
          locationId: existingLot.locationId,
          name: validatedData.name,
          id: { not: params.id },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'طبقه با این نام در این محل پارکینگ وجود دارد' },
          { status: 400 }
        );
      }
    }

    // Update the parking lot
    const parkingLot = await db.parkingLot.update({
      where: { id: params.id },
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

    // Update parking status if capacity changed
    if (validatedData.totalCapacity) {
      await db.parkingStatus.update({
        where: { lotId: params.id },
        data: {
          totalCapacity: validatedData.totalCapacity,
          availableSpaces: validatedData.totalCapacity - parkingLot.occupiedSpaces,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: parkingLot,
      message: 'طبقه پارکینگ با موفقیت به‌روزرسانی شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating parking lot:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی طبقه پارکینگ' },
      { status: 500 }
    );
  }
}

// DELETE /api/parking-lots/[id] - Delete parking lot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if parking lot exists
    const existingLot = await db.parkingLot.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            parkingSpots: true,
            sessions: true,
          },
        },
      },
    });

    if (!existingLot) {
      return NextResponse.json(
        { success: false, error: 'طبقه پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if lot has related data
    const hasRelatedData = 
      existingLot._count.parkingSpots > 0 ||
      existingLot._count.sessions > 0;

    if (hasRelatedData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'این طبقه دارای جای پارک یا جلسه فعال است و قابل حذف نیست' 
        },
        { status: 400 }
      );
    }

    // Delete parking status
    await db.parkingStatus.delete({
      where: { lotId: params.id },
    });

    // Delete the parking lot
    await db.parkingLot.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'طبقه پارکینگ با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting parking lot:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف طبقه پارکینگ' },
      { status: 500 }
    );
  }
}