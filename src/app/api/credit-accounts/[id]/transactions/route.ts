import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') || ''

    const skip = (page - 1) * limit

    // Check if account exists
    const account = await db.creditAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'حساب اعتباری یافت نشد' },
        { status: 404 }
      )
    }

    // Build where clause
    const where = type ? { type: type as any } : {}

    // Fetch transactions
    const transactions = await db.creditTransaction.findMany({
      where: { accountId, ...where },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Get total count
    const total = await db.creditTransaction.count({
      where: { accountId, ...where },
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching credit transactions:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات تراکنش‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const body = await request.json()
    const { amount, type, description, referenceId } = body

    // Check if account exists
    const account = await db.creditAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'حساب اعتباری یافت نشد' },
        { status: 404 }
      )
    }

    // Calculate new balance
    let newBalance = account.balance
    if (type === 'CHARGE' || type === 'REFUND') {
      newBalance += amount
    } else if (type === 'DEDUCTION') {
      newBalance -= amount
    } else if (type === 'ADJUSTMENT') {
      newBalance = amount
    }

    // Create transaction
    const transaction = await db.creditTransaction.create({
      data: {
        accountId,
        amount,
        type: type as any,
        description: description || '',
        referenceId,
        balanceBefore: account.balance,
        balanceAfter: newBalance,
      },
    })

    // Update account balance
    await db.creditAccount.update({
      where: { id: accountId },
      data: { balance: newBalance },
    })

    // Check for low balance and create notification if needed
    if (newBalance <= account.warningThreshold && newBalance > 0) {
      await db.creditNotification.create({
        data: {
          accountId,
          type: 'LOW_BALANCE',
          title: 'هشدار موجودی کم',
          message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
          severity: newBalance <= account.warningThreshold * 0.5 ? 'HIGH' : 'MEDIUM',
        },
      })
    }

    // Check for zero balance
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
    }

    return NextResponse.json({
      message: 'تراکنش با موفقیت ثبت شد',
      transaction,
      newBalance,
    })
  } catch (error) {
    console.error('Error creating credit transaction:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت تراکنش' },
      { status: 500 }
    )
  }
}