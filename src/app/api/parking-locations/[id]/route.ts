import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a parking location
const updateLocationSchema = z.object({
  name: z.string().min(1, 'نام محل الزامی است').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/parking-locations/[id] - Get single parking location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const location = await db.parkingLocation.findUnique({
      where: { id: params.id },
      include: {
        cameras: {
          select: {
            id: true,
            name: true,
            type: true,
            direction: true,
            isActive: true,
            ipAddress: true,
            resolution: true,
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
      },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error fetching parking location:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات محل پارکینگ' },
      { status: 500 }
    );
  }
}

// PUT /api/parking-locations/[id] - Update parking location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    // Check if location exists
    const existingLocation = await db.parkingLocation.findUnique({
      where: { id: params.id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if name is being changed and already exists
    if (validatedData.name && validatedData.name !== existingLocation.name) {
      const nameExists = await db.parkingLocation.findFirst({
        where: {
          name: validatedData.name,
          id: { not: params.id },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'محل پارکینگ با این نام وجود دارد' },
          { status: 400 }
        );
      }
    }

    // Update the parking location
    const location = await db.parkingLocation.update({
      where: { id: params.id },
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
      message: 'محل پارکینگ با موفقیت به‌روزرسانی شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating parking location:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی محل پارکینگ' },
      { status: 500 }
    );
  }
}

// DELETE /api/parking-locations/[id] - Delete parking location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if location exists
    const existingLocation = await db.parkingLocation.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            cameras: true,
            parkingLots: true,
            doors: true,
          },
        },
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if location has related data
    const hasRelatedData = 
      existingLocation._count.cameras > 0 ||
      existingLocation._count.parkingLots > 0 ||
      existingLocation._count.doors > 0;

    if (hasRelatedData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'این محل پارکینگ دارای دوربین، طبقه یا درب است و قابل حذف نیست' 
        },
        { status: 400 }
      );
    }

    // Delete the parking location
    await db.parkingLocation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'محل پارکینگ با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting parking location:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف محل پارکینگ' },
      { status: 500 }
    );
  }
}