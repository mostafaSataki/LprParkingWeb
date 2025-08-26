import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/shifts/[id] - Get specific shift
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shift = await db.shift.findUnique({
      where: { id: params.id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        sessions: {
          include: {
            vehicle: true,
            tariff: true
          },
          orderBy: { entryTime: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        reports: {
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'شیفت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error fetching shift:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات شیفت' },
      { status: 500 }
    );
  }
}

// PUT /api/shifts/[id] - Update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, endTime, isActive } = body;

    const shift = await db.shift.findUnique({
      where: { id: params.id }
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'شیفت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedShift = await db.shift.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی شیفت' },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id] - Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shift = await db.shift.findUnique({
      where: { id: params.id }
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'شیفت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if shift has related sessions or payments
    const [sessionCount, paymentCount] = await Promise.all([
      db.parkingSession.count({ where: { shiftId: params.id } }),
      db.payment.count({ where: { shiftId: params.id } })
    ]);

    if (sessionCount > 0 || paymentCount > 0) {
      return NextResponse.json(
        { error: 'این شیفت دارای تراکنش‌های مرتبط است و قابل حذف نیست' },
        { status: 400 }
      );
    }

    await db.shift.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'شیفت با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'خطا در حذف شیفت' },
      { status: 500 }
    );
  }
}