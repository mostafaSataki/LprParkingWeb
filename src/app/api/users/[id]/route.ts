import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shifts: true,
            payments: true,
            auditLogs: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, username, password, role, isActive } = body;

    const user = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Check for duplicate email/username
    if (email !== undefined || username !== undefined) {
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { email: email || user.email },
            { username: username || user.username }
          ],
          NOT: { id: params.id }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'کاربری با این ایمیل یا نام کاربری قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user has related data
    const [shiftCount, paymentCount] = await Promise.all([
      db.shift.count({ where: { operatorId: params.id } }),
      db.payment.count({ where: { operatorId: params.id } })
    ]);

    if (shiftCount > 0 || paymentCount > 0) {
      return NextResponse.json(
        { error: 'این کاربر دارای تراکنش‌های مرتبط است و قابل حذف نیست' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'خطا در حذف کاربر' },
      { status: 500 }
    );
  }
}