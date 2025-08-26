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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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
    const where: any = { accountId }

    if (type) {
      where.type = type as any
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount)
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { referenceId: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build sort options
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Fetch transactions
    const transactions = await db.creditTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    })

    // Get total count
    const total = await db.creditTransaction.count({ where })

    // Get statistics for the filtered transactions
    const stats = await db.creditTransaction.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
      _min: { amount: true },
      _max: { amount: true },
      _count: { id: true },
    })

    // Group by type for summary
    const typeStats = await db.creditTransaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    })

    // Get daily totals for chart
    const dailyTotals = await db.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(CASE WHEN type = 'CHARGE' THEN amount ELSE 0 END) as charges,
        SUM(CASE WHEN type = 'DEDUCTION' THEN amount ELSE 0 END) as deductions,
        COUNT(*) as count
      FROM credit_transactions
      WHERE accountId = ${accountId}
        ${startDate ? `AND createdAt >= ${new Date(startDate)}` : ''}
        ${endDate ? `AND createdAt <= ${new Date(endDate)}` : ''}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 30
    ` as any[]

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        totalAmount: stats._sum.amount || 0,
        averageAmount: stats._avg.amount || 0,
        minAmount: stats._min.amount || 0,
        maxAmount: stats._max.amount || 0,
        totalCount: stats._count.id,
      },
      typeStats,
      dailyTotals,
      filters: {
        type,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching enhanced credit transactions:', error)
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
    const { action, transactionIds, data } = body

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

    switch (action) {
      case 'bulk_delete':
        // Delete multiple transactions
        if (!transactionIds || !Array.isArray(transactionIds)) {
          return NextResponse.json(
            { error: 'شناسه تراکنش‌ها الزامی است' },
            { status: 400 }
          )
        }

        const deletedTransactions = await db.creditTransaction.deleteMany({
          where: {
            accountId,
            id: { in: transactionIds },
          },
        })

        // Recalculate account balance
        const remainingTransactions = await db.creditTransaction.findMany({
          where: { accountId },
          orderBy: { createdAt: 'desc' },
        })

        const newBalance = remainingTransactions.length > 0 
          ? remainingTransactions[0].balanceAfter 
          : 0

        await db.creditAccount.update({
          where: { id: accountId },
          data: { balance: newBalance },
        })

        return NextResponse.json({
          message: `${deletedTransactions.count} تراکنش با موفقیت حذف شدند`,
          deletedCount: deletedTransactions.count,
          newBalance,
        })

      case 'adjust_transaction':
        // Adjust a specific transaction
        if (!data || !data.transactionId || data.newAmount === undefined) {
          return NextResponse.json(
            { error: 'اطلاعات تنظیم تراکنش ناقص است' },
            { status: 400 }
          )
        }

        const transaction = await db.creditTransaction.findUnique({
          where: { id: data.transactionId },
        })

        if (!transaction || transaction.accountId !== accountId) {
          return NextResponse.json(
            { error: 'تراکنش یافت نشد' },
            { status: 404 }
          )
        }

        const amountDifference = data.newAmount - transaction.amount
        
        // Update the transaction
        const updatedTransaction = await db.creditTransaction.update({
          where: { id: data.transactionId },
          data: {
            amount: data.newAmount,
            description: data.description || transaction.description,
            balanceAfter: transaction.balanceAfter + amountDifference,
          },
        })

        // Update all subsequent transactions
        const subsequentTransactions = await db.creditTransaction.findMany({
          where: {
            accountId,
            createdAt: { gt: transaction.createdAt },
          },
          orderBy: { createdAt: 'asc' },
        })

        for (const subsequent of subsequentTransactions) {
          await db.creditTransaction.update({
            where: { id: subsequent.id },
            data: {
              balanceBefore: subsequent.balanceBefore + amountDifference,
              balanceAfter: subsequent.balanceAfter + amountDifference,
            },
          })
        }

        // Update account balance
        await db.creditAccount.update({
          where: { id: accountId },
          data: { balance: account.balance + amountDifference },
        })

        // Create adjustment record
        await db.creditTransaction.create({
          data: {
            accountId,
            amount: amountDifference,
            type: 'ADJUSTMENT',
            description: `تنظیم تراکنش ${data.transactionId}`,
            balanceBefore: account.balance,
            balanceAfter: account.balance + amountDifference,
          },
        })

        return NextResponse.json({
          message: 'تراکنش با موفقیت تنظیم شد',
          transaction: updatedTransaction,
          newBalance: account.balance + amountDifference,
        })

      case 'add_note':
        // Add note to transaction
        if (!data || !data.transactionId || !data.note) {
          return NextResponse.json(
            { error: 'اطلاعات یادداشت ناقص است' },
            { status: 400 }
          )
        }

        const notedTransaction = await db.creditTransaction.update({
          where: { id: data.transactionId },
          data: {
            description: data.note,
          },
        })

        return NextResponse.json({
          message: 'یادداشت با موفقیت اضافه شد',
          transaction: notedTransaction,
        })

      default:
        return NextResponse.json(
          { error: 'عملیات نامعتبر است' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in enhanced transaction operations:', error)
    return NextResponse.json(
      { error: 'خطا در انجام عملیات تراکنش' },
      { status: 500 }
    )
  }
}