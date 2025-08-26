import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if holiday exists
    const holiday = await db.holiday.findUnique({
      where: { id }
    });

    if (!holiday) {
      return NextResponse.json(
        { error: 'تعطیلی یافت نشد' },
        { status: 404 }
      );
    }

    // Don't allow deleting Friday holidays
    if (holiday.type === 'FRIDAY') {
      return NextResponse.json(
        { error: 'تعطیلی جمعه قابل حذف نیست' },
        { status: 400 }
      );
    }

    // Delete holiday
    await db.holiday.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'تعطیلی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تعطیلی' },
      { status: 500 }
    );
  }
}