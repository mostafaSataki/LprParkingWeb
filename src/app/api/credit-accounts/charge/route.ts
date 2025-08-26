import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, amount, description } = body;

    // Validate required fields
    if (!accountId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'شناسه حساب و مبلغ شارژ الزامی هستند' },
        { status: 400 }
      );
    }

    // Get current account
    const account = await db.creditAccount.findUnique({
      where: { id: accountId },
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

    if (!account) {
      return NextResponse.json(
        { error: 'حساب اعتباری یافت نشد' },
        { status: 404 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: 'حساب اعتباری غیرفعال است' },
        { status: 400 }
      );
    }

    // Process charge transaction
    const result = await db.$transaction(async (tx) => {
      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore + amount;

      // Update account balance
      const updatedAccount = await tx.creditAccount.update({
        where: { id: accountId },
        data: {
          balance: balanceAfter,
          updatedAt: new Date()
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

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          accountId,
          amount,
          type: 'CHARGE',
          description: description || 'شارژ دستی',
          balanceBefore,
          balanceAfter
        }
      });

      // Create notification
      await tx.creditNotification.create({
        data: {
          accountId,
          type: 'MANUAL_CHARGE',
          title: 'شارژ حساب',
          message: `حساب شما به مبلغ ${amount.toLocaleString()} تومان شارژ شد.`,
          severity: 'LOW'
        }
      });

      return { updatedAccount, transaction };
    });

    return NextResponse.json({
      message: 'حساب با موفقیت شارژ شد',
      account: result.updatedAccount,
      transaction: result.transaction
    });

  } catch (error) {
    console.error('Error charging account:', error);
    return NextResponse.json(
      { error: 'خطا در شارژ حساب' },
      { status: 500 }
    );
  }
}