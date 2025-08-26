import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const body = await request.json()
    const { amount, description = 'کسر هزینه پارکینگ', referenceId, allowNegative = false } = body

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
        { error: 'مبلغ کسر باید مثبت باشد' },
        { status: 400 }
      )
    }

    // Check if account has sufficient balance
    if (account.balance < amount && !allowNegative) {
      // Check if credit limit allows negative balance
      if (account.creditLimit > 0 && (account.balance - amount) >= -account.creditLimit) {
        // Allow negative balance within credit limit
      } else {
        return NextResponse.json(
          { error: 'موجودی حساب کافی نیست' },
          { status: 400 }
        )
      }
    }

    // Calculate new balance
    const newBalance = account.balance - amount

    // Create transaction
    const transaction = await db.creditTransaction.create({
      data: {
        accountId,
        amount,
        type: 'DEDUCTION',
        description,
        referenceId,
        balanceBefore: account.balance,
        balanceAfter: newBalance,
      },
    })

    // Update account balance
    const updatedAccount = await db.creditAccount.update({
      where: { id: accountId },
      data: { balance: newBalance },
    })

    // Check for low balance and create notifications
    const settings = account.settings
    if (settings) {
      // Critical balance notification
      if (newBalance <= settings.criticalThreshold && newBalance > 0) {
        await db.creditNotification.create({
          data: {
            accountId,
            type: 'LOW_BALANCE',
            title: 'هشدار بحرانی - موجودی بسیار کم',
            message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است. لطفاً فوراً حساب خود را شارژ کنید.`,
            severity: 'CRITICAL',
          },
        })
      }
      // Warning level 2
      else if (newBalance <= settings.warningThreshold2 && newBalance > settings.criticalThreshold) {
        await db.creditNotification.create({
          data: {
            accountId,
            type: 'LOW_BALANCE',
            title: 'هشدار - موجودی کم',
            message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
            severity: 'HIGH',
          },
        })
      }
      // Warning level 1
      else if (newBalance <= settings.warningThreshold1 && newBalance > settings.warningThreshold2) {
        await db.creditNotification.create({
          data: {
            accountId,
            type: 'LOW_BALANCE',
            title: 'اطلاعیه - کاهش موجودی',
            message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
            severity: 'MEDIUM',
          },
        })
      }
      // Low balance
      else if (newBalance <= settings.lowBalanceThreshold && newBalance > settings.warningThreshold1) {
        await db.creditNotification.create({
          data: {
            accountId,
            type: 'LOW_BALANCE',
            title: 'اطلاعیه - کاهش موجودی',
            message: `موجودی حساب شما در حال کاهش است. موجودی فعلی: ${newBalance.toLocaleString('fa-IR')} تومان.`,
            severity: 'LOW',
          },
        })
      }
    }

    // Check for zero or negative balance
    if (newBalance <= 0) {
      await db.creditNotification.create({
        data: {
          accountId,
          type: 'LOW_BALANCE',
          title: 'موجودی حساب صفر شد',
          message: 'موجودی حساب شما به پایان رسیده است. لطفاً حساب خود را شارژ کنید.',
          severity: 'CRITICAL',
        },
      })

      // Suspend account if settings allow
      if (settings?.suspendOnZeroBalance && newBalance <= 0) {
        await db.creditAccount.update({
          where: { id: accountId },
          data: { isActive: false },
        })

        await db.creditNotification.create({
          data: {
            accountId,
            type: 'ACCOUNT_SUSPENDED',
            title: 'حساب شما به حالت تعلیق درآمد',
            message: 'حساب اعتباری شما به دلیل عدم موجودی به حالت تعلیق درآمد. برای فعال‌سازی مجدد، حساب خود را شارژ کنید.',
            severity: 'CRITICAL',
          },
        })
      }
    }

    // Check for credit limit exceeded
    if (account.creditLimit > 0 && newBalance < -account.creditLimit) {
      await db.creditNotification.create({
        data: {
          accountId,
          type: 'CREDIT_LIMIT_EXCEEDED',
          title: 'سقف اعتبار exceeded',
          message: 'شما از سقف اعتبار خود فراتر رفته‌اید. لطفاً فوراً حساب خود را شارژ کنید.',
          severity: 'CRITICAL',
        },
      })
    }

    return NextResponse.json({
      message: 'کسر مبلغ با موفقیت انجام شد',
      transaction,
      account: {
        ...updatedAccount,
        balance: newBalance,
      },
    })
  } catch (error) {
    console.error('Error deducting from credit account:', error)
    return NextResponse.json(
      { error: 'خطا در کسر مبلغ از حساب' },
      { status: 500 }
    )
  }
}