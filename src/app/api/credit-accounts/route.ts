import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/credit-accounts - Get all credit accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [accounts, total] = await Promise.all([
      db.creditAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          },
          settings: true,
          _count: {
            select: {
              transactions: true,
              sessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.creditAccount.count({ where })
    ]);

    return NextResponse.json({
      accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching credit accounts:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات حساب‌های اعتباری' },
      { status: 500 }
    );
  }
}

// POST /api/credit-accounts - Create new credit account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, initialBalance = 0, monthlyLimit = 0, creditLimit = 0, warningThreshold = 10000 } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user already has a credit account
    const existingAccount = await db.creditAccount.findFirst({
      where: { userId }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'کاربر قبلاً حساب اعتباری دارد' },
        { status: 400 }
      );
    }

    // Create credit account with transaction
    const result = await db.$transaction(async (tx) => {
      const account = await tx.creditAccount.create({
        data: {
          userId,
          balance: initialBalance,
          monthlyLimit,
          creditLimit,
          warningThreshold,
          isActive: true,
          autoCharge: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create default settings
      await tx.creditAccountSettings.create({
        data: {
          accountId: account.id,
          autoMonthlyCharge: true,
          monthlyChargeAmount: 100000,
          chargeDayOfMonth: 1,
          lowBalanceThreshold: warningThreshold,
          warningThreshold1: warningThreshold * 5,
          warningThreshold2: warningThreshold * 2,
          criticalThreshold: warningThreshold,
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          enableInAppNotifications: true,
          suspendOnZeroBalance: true
        }
      });

      // Create initial transaction if balance > 0
      if (initialBalance > 0) {
        await tx.creditTransaction.create({
          data: {
            accountId: account.id,
            amount: initialBalance,
            type: 'CHARGE',
            description: 'شارژ اولیه حساب',
            balanceBefore: 0,
            balanceAfter: initialBalance
          }
        });
      }

      return account;
    });

    return NextResponse.json({
      message: 'حساب اعتباری با موفقیت ایجاد شد',
      account: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating credit account:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد حساب اعتباری' },
      { status: 500 }
    );
  }
}