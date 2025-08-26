import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date()

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(start, end)
      case 'transactions':
        return await getTransactionsReport(start, end)
      case 'balances':
        return await getBalancesReport(start, end)
      case 'monthly-charges':
        return await getMonthlyChargesReport(start, end)
      case 'notifications':
        return await getNotificationsReport(start, end)
      case 'account-activity':
        return await getAccountActivityReport(start, end)
      default:
        return NextResponse.json(
          { error: 'نوع گزارش نامعتبر است' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating credit account report:', error)
    return NextResponse.json(
      { error: 'خطا در تولید گزارش' },
      { status: 500 }
    )
  }
}

async function getOverviewReport(start: Date, end: Date) {
  // Get basic statistics
  const totalAccounts = await db.creditAccount.count()
  const activeAccounts = await db.creditAccount.count({ where: { isActive: true } })
  const suspendedAccounts = await db.creditAccount.count({ where: { isActive: false } })

  // Get balance statistics
  const balanceStats = await db.creditAccount.aggregate({
    _sum: { balance: true },
    _avg: { balance: true },
    _min: { balance: true },
    _max: { balance: true },
  })

  // Get transaction statistics for the period
  const transactionStats = await db.creditTransaction.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Get charge vs deduction breakdown
  const chargeStats = await db.creditTransaction.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
      type: 'CHARGE',
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  const deductionStats = await db.creditTransaction.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
      type: 'DEDUCTION',
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Get accounts with low balance
  const lowBalanceAccounts = await db.creditAccount.count({
    where: {
      isActive: true,
      balance: { lte: 10000 },
    },
  })

  // Get monthly charge statistics
  const monthlyChargeStats = await db.monthlyCharge.aggregate({
    where: {
      chargeDate: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  return NextResponse.json({
    type: 'overview',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        suspended: suspendedAccounts,
        lowBalance: lowBalanceAccounts,
      },
      balances: {
        total: balanceStats._sum.balance || 0,
        average: balanceStats._avg.balance || 0,
        min: balanceStats._min.balance || 0,
        max: balanceStats._max.balance || 0,
      },
      transactions: {
        total: transactionStats._count.id,
        totalAmount: transactionStats._sum.amount || 0,
        charges: {
          count: chargeStats._count.id,
          amount: chargeStats._sum.amount || 0,
        },
        deductions: {
          count: deductionStats._count.id,
          amount: deductionStats._sum.amount || 0,
        },
      },
      monthlyCharges: {
        count: monthlyChargeStats._count.id,
        amount: monthlyChargeStats._sum.amount || 0,
      },
    },
  })
}

async function getTransactionsReport(start: Date, end: Date) {
  // Get transactions grouped by type
  const transactionsByType = await db.creditTransaction.groupBy({
    by: ['type'],
    where: {
      createdAt: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
    _avg: { amount: true },
  })

  // Get transactions grouped by day
  const transactionsByDay = await db.creditTransaction.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Get top transactions
  const topTransactions = await db.creditTransaction.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    include: {
      account: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: { amount: 'desc' },
    take: 20,
  })

  // Get transaction trends (daily aggregation)
  const dailyTrends = await db.$queryRaw`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM credit_transactions
    WHERE createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY DATE(createdAt)
    ORDER BY date
  ` as any[]

  return NextResponse.json({
    type: 'transactions',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      byType: transactionsByType,
      byDay: transactionsByDay,
      topTransactions,
      dailyTrends,
    },
  })
}

async function getBalancesReport(start: Date, end: Date) {
  // Get balance distribution
  const balanceDistribution = await db.creditAccount.findMany({
    select: {
      balance: true,
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { balance: 'desc' },
  })

  // Group accounts by balance ranges
  const balanceRanges = {
    zero: balanceDistribution.filter(a => a.balance <= 0).length,
    low: balanceDistribution.filter(a => a.balance > 0 && a.balance <= 10000).length,
    medium: balanceDistribution.filter(a => a.balance > 10000 && a.balance <= 50000).length,
    high: balanceDistribution.filter(a => a.balance > 50000 && a.balance <= 100000).length,
    veryHigh: balanceDistribution.filter(a => a.balance > 100000).length,
  }

  // Get accounts with highest and lowest balances
  const topBalances = balanceDistribution.slice(0, 10)
  const bottomBalances = balanceDistribution.slice(-10).reverse()

  // Get balance changes over time (from transactions)
  const balanceChanges = await db.$queryRaw`
    SELECT 
      DATE(createdAt) as date,
      SUM(CASE WHEN type = 'CHARGE' THEN amount ELSE -amount END) as net_change
    FROM credit_transactions
    WHERE createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY DATE(createdAt)
    ORDER BY date
  ` as any[]

  return NextResponse.json({
    type: 'balances',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      distribution: balanceRanges,
      topBalances,
      bottomBalances,
      balanceChanges,
      totalAccounts: balanceDistribution.length,
    },
  })
}

async function getMonthlyChargesReport(start: Date, end: Date) {
  // Get monthly charge statistics
  const monthlyCharges = await db.monthlyCharge.findMany({
    where: {
      chargeDate: { gte: start, lte: end },
    },
    include: {
      account: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: { chargeDate: 'desc' },
  })

  // Group by status
  const byStatus = monthlyCharges.reduce((acc, charge) => {
    if (!acc[charge.status]) {
      acc[charge.status] = []
    }
    acc[charge.status].push(charge)
    return acc
  }, {} as Record<string, typeof monthlyCharges>)

  // Calculate statistics
  const stats = {
    total: monthlyCharges.length,
    completed: monthlyCharges.filter(c => c.status === 'COMPLETED').length,
    failed: monthlyCharges.filter(c => c.status === 'FAILED').length,
    pending: monthlyCharges.filter(c => c.status === 'PENDING').length,
    processing: monthlyCharges.filter(c => c.status === 'PROCESSING').length,
    totalAmount: monthlyCharges.reduce((sum, c) => sum + c.amount, 0),
    averageAmount: monthlyCharges.length > 0 ? monthlyCharges.reduce((sum, c) => sum + c.amount, 0) / monthlyCharges.length : 0,
  }

  // Get monthly trends
  const monthlyTrends = await db.$queryRaw`
    SELECT 
      strftime('%Y-%m', chargeDate) as month,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM monthly_charges
    WHERE chargeDate >= ${start} AND chargeDate <= ${end}
    GROUP BY strftime('%Y-%m', chargeDate)
    ORDER BY month
  ` as any[]

  return NextResponse.json({
    type: 'monthly-charges',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      charges: monthlyCharges,
      byStatus,
      stats,
      monthlyTrends,
    },
  })
}

async function getNotificationsReport(start: Date, end: Date) {
  // Get notification statistics
  const notifications = await db.creditNotification.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    include: {
      account: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by type
  const byType = notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = []
    }
    acc[notification.type].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)

  // Group by severity
  const bySeverity = notifications.reduce((acc, notification) => {
    if (!acc[notification.severity]) {
      acc[notification.severity] = []
    }
    acc[notification.severity].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)

  // Calculate statistics
  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.isSent).length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: Object.keys(byType).reduce((acc, type) => {
      acc[type] = byType[type].length
      return acc
    }, {} as Record<string, number>),
    bySeverity: Object.keys(bySeverity).reduce((acc, severity) => {
      acc[severity] = bySeverity[severity].length
      return acc
    }, {} as Record<string, number>),
  }

  // Get notification trends
  const notificationTrends = await db.$queryRaw`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as count,
      type
    FROM credit_notifications
    WHERE createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY DATE(createdAt), type
    ORDER BY date
  ` as any[]

  return NextResponse.json({
    type: 'notifications',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      notifications,
      byType,
      bySeverity,
      stats,
      trends: notificationTrends,
    },
  })
}

async function getAccountActivityReport(start: Date, end: Date) {
  // Get account activity metrics
  const accounts = await db.creditAccount.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
      transactions: {
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          type: true,
          createdAt: true,
        },
      },
      notifications: {
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          type: true,
          severity: true,
          createdAt: true,
        },
      },
    },
  })

  // Calculate activity metrics for each account
  const accountActivity = accounts.map(account => {
    const transactions = account.transactions
    const notifications = account.notifications

    return {
      accountId: account.id,
      userName: account.user.name,
      userEmail: account.user.email,
      balance: account.balance,
      isActive: account.isActive,
      transactionCount: transactions.length,
      notificationCount: notifications.length,
      totalCharged: transactions
        .filter(t => t.type === 'CHARGE')
        .reduce((sum, t) => sum + t.amount, 0),
      totalDeducted: transactions
        .filter(t => t.type === 'DEDUCTION')
        .reduce((sum, t) => sum + t.amount, 0),
      lastTransaction: transactions.length > 0 ? transactions[0].createdAt : null,
      lastNotification: notifications.length > 0 ? notifications[0].createdAt : null,
      highSeverityNotifications: notifications.filter(n => n.severity === 'HIGH' || n.severity === 'CRITICAL').length,
    }
  })

  // Sort by activity level
  const mostActive = [...accountActivity].sort((a, b) => b.transactionCount - a.transactionCount).slice(0, 10)
  const leastActive = [...accountActivity].sort((a, b) => a.transactionCount - b.transactionCount).slice(0, 10)
  const mostNotified = [...accountActivity].sort((a, b) => b.notificationCount - a.notificationCount).slice(0, 10)

  // Overall statistics
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.isActive).length,
    accountsWithTransactions: accountActivity.filter(a => a.transactionCount > 0).length,
    accountsWithNotifications: accountActivity.filter(a => a.notificationCount > 0).length,
    averageTransactionsPerAccount: accountActivity.reduce((sum, a) => sum + a.transactionCount, 0) / accounts.length,
    averageNotificationsPerAccount: accountActivity.reduce((sum, a) => sum + a.notificationCount, 0) / accounts.length,
  }

  return NextResponse.json({
    type: 'account-activity',
    period: { start: start.toISOString(), end: end.toISOString() },
    data: {
      accountActivity,
      mostActive,
      leastActive,
      mostNotified,
      stats,
    },
  })
}