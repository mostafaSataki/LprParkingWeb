import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const body = await request.json()
    const { amount, description = 'شارژ دستی حساب', autoCharge = false } = body

    // Check if account exists
    const account = await db.creditAccount.findUnique({
      where: { id: accountId },
      include: {
        settings: true,
        user: true,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'حساب اعتباری یافت نشد' },
        { status: 404 }
      )
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: 'حساب اعتباری غیرفعال است' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'مبلغ شارژ باید مثبت باشد' },
        { status: 400 }
      )
    }

    // Calculate new balance
    const newBalance = account.balance + amount

    // Create transaction
    const transaction = await db.creditTransaction.create({
      data: {
        accountId,
        amount,
        type: 'CHARGE',
        description,
        balanceBefore: account.balance,
        balanceAfter: newBalance,
      },
    })

    // Update account balance
    const updatedAccount = await db.creditAccount.update({
      where: { id: accountId },
      data: { 
        balance: newBalance,
        lastChargedAt: new Date(),
        ...(autoCharge && { 
          nextChargeDate: calculateNextChargeDate(account.settings?.chargeDayOfMonth || 1)
        }),
      },
    })

    // Create monthly charge record if it's an auto charge
    if (autoCharge) {
      await db.monthlyCharge.create({
        data: {
          accountId,
          amount,
          chargeDate: new Date(),
          nextChargeDate: calculateNextChargeDate(account.settings?.chargeDayOfMonth || 1),
          status: 'COMPLETED',
          transactionId: transaction.id,
          notes: description,
        },
      })
    }

    // Create success notification
    await db.creditNotification.create({
      data: {
        accountId,
        type: 'MANUAL_CHARGE',
        title: 'شارژ حساب با موفقیت انجام شد',
        message: `حساب شما به مبلغ ${amount.toLocaleString('fa-IR')} تومان شارژ شد. موجودی جدید: ${newBalance.toLocaleString('fa-IR')} تومان.`,
        severity: 'LOW',
      },
    })

    // If account was suspended due to zero balance, reactivate it
    if (account.balance <= 0 && newBalance > 0) {
      await db.creditNotification.create({
        data: {
          accountId,
          type: 'ACCOUNT_REACTIVATED',
          title: 'حساب شما مجدداً فعال شد',
          message: 'حساب اعتباری شما به دلیل شارژ موفقیت‌آمیز مجدداً فعال شد.',
          severity: 'MEDIUM',
        },
      })
    }

    return NextResponse.json({
      message: 'شارژ حساب با موفقیت انجام شد',
      transaction,
      account: {
        ...updatedAccount,
        balance: newBalance,
      },
    })
  } catch (error) {
    console.error('Error charging credit account:', error)
    return NextResponse.json(
      { error: 'خطا در شارژ حساب' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next charge date
function calculateNextChargeDate(dayOfMonth: number): Date {
  const now = new Date()
  const currentDay = now.getDate()
  let nextDate = new Date(now)

  if (currentDay <= dayOfMonth) {
    // Next charge is in the current month
    nextDate.setDate(dayOfMonth)
  } else {
    // Next charge is in the next month
    nextDate.setMonth(now.getMonth() + 1)
    nextDate.setDate(dayOfMonth)
  }

  return nextDate
}