import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const person = await db.person.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        },
        sessions: {
          select: {
            id: true,
            entryTime: true,
            exitTime: true,
            status: true,
            plateNumber: true,
            vehicleType: true
          },
          orderBy: { entryTime: 'desc' },
          take: 10
        }
      }
    });

    if (!person) {
      return NextResponse.json(
        { error: 'شخص مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات شخص' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      nationalCode,
      mobile,
      email,
      organization,
      department,
      position,
      vehicles,
      accessLevel,
      isActive,
      notes
    } = body;

    // Check if national code already exists (excluding current person)
    if (nationalCode) {
      const existingPerson = await db.person.findFirst({
        where: {
          nationalCode,
          NOT: { id: params.id }
        }
      });

      if (existingPerson) {
        return NextResponse.json(
          { error: 'کد ملی قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    // Update person basic info
    const person = await db.person.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        nationalCode,
        mobile,
        email,
        organization,
        department,
        position,
        accessLevel,
        isActive,
        notes
      }
    });

    // Update vehicles if provided
    if (vehicles !== undefined) {
      // First, deactivate all existing vehicles
      await db.personVehicle.updateMany({
        where: { personId: params.id },
        data: { isActive: false }
      });

      // Then add/update the provided vehicles
      for (const vehicle of vehicles) {
        // Check if vehicle already exists
        const existingVehicle = await db.personVehicle.findFirst({
          where: {
            personId: params.id,
            plateNumber: vehicle.plateNumber
          }
        });

        if (existingVehicle) {
          // Update existing vehicle
          await db.personVehicle.update({
            where: { id: existingVehicle.id },
            data: {
              vehicleType: vehicle.vehicleType || 'CAR',
              vehicleName: vehicle.vehicleName,
              isPrimary: vehicle.isPrimary || false,
              isActive: true,
              notes: vehicle.notes
            }
          });
        } else {
          // Create new vehicle
          await db.personVehicle.create({
            data: {
              personId: params.id,
              plateNumber: vehicle.plateNumber,
              vehicleType: vehicle.vehicleType || 'CAR',
              vehicleName: vehicle.vehicleName,
              isPrimary: vehicle.isPrimary || false,
              isActive: true,
              notes: vehicle.notes
            }
          });
        }
      }
    }

    // Fetch the updated person with all relations
    const updatedPerson = await db.person.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        },
        sessions: {
          select: {
            id: true,
            entryTime: true,
            exitTime: true,
            status: true,
            plateNumber: true,
            vehicleType: true
          },
          orderBy: { entryTime: 'desc' },
          take: 10
        }
      }
    });

    return NextResponse.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی شخص' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if person has active sessions
    const activeSessions = await db.parkingSession.count({
      where: {
        personId: params.id,
        status: 'ACTIVE'
      }
    });

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'شخص دارای جلسات پارکینگ فعال است و قابل حذف نیست' },
        { status: 400 }
      );
    }

    await db.person.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'شخص با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json(
      { error: 'خطا در حذف شخص' },
      { status: 500 }
    );
  }
}