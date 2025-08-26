import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { forceAll = false } = body

    const results = {
      processed: 0,
      notificationsCreated: 0,
      accountsWithIssues: 0,
      errors: [] as string[],
    }

    // Get all active credit accounts with their settings
    const accounts = await db.creditAccount.findMany({
      where: {
        isActive: true,
      },
      include: {
        settings: true,
        user: true,
        notifications: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            },
            type: {
              in: ['LOW_BALANCE', 'CREDIT_LIMIT_EXCEEDED']
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
      },
    })

    results.processed = accounts.length

    for (const account of accounts) {
      try {
        const settings = account.settings
        if (!settings) {
          continue
        }

        const balance = account.balance
        const creditLimit = account.creditLimit
        let hasIssue = false
        let notificationsToCreate = []

        // Check for critical balance
        if (balance <= settings.criticalThreshold && balance > 0) {
          // Check if we already sent a critical notification in the last 24 hours
          const hasRecentCritical = account.notifications.some(
            n => n.type === 'LOW_BALANCE' && n.severity === 'CRITICAL'
          )

          if (!hasRecentCritical || forceAll) {
            notificationsToCreate.push({
              type: 'LOW_BALANCE',
              title: 'هشدار بحرانی - موجودی بسیار کم',
              message: `موجودی حساب شما به ${balance.toLocaleString('fa-IR')} تومان کاهش یافته است. لطفاً فوراً حساب خود را شارژ کنید.`,
              severity: 'CRITICAL',
            })
            hasIssue = true
          }
        }

        // Check for warning level 2
        else if (balance <= settings.warningThreshold2 && balance > settings.criticalThreshold) {
          const hasRecentWarning = account.notifications.some(
            n => n.type === 'LOW_BALANCE' && n.severity === 'HIGH'
          )

          if (!hasRecentWarning || forceAll) {
            notificationsToCreate.push({
              type: 'LOW_BALANCE',
              title: 'هشدار - موجودی کم',
              message: `موجودی حساب شما به ${balance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
              severity: 'HIGH',
            })
            hasIssue = true
          }
        }

        // Check for warning level 1
        else if (balance <= settings.warningThreshold1 && balance > settings.warningThreshold2) {
          const hasRecentWarning = account.notifications.some(
            n => n.type === 'LOW_BALANCE' && n.severity === 'MEDIUM'
          )

          if (!hasRecentWarning || forceAll) {
            notificationsToCreate.push({
              type: 'LOW_BALANCE',
              title: 'اطلاعیه - کاهش موجودی',
              message: `موجودی حساب شما به ${balance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
              severity: 'MEDIUM',
            })
            hasIssue = true
          }
        }

        // Check for low balance
        else if (balance <= settings.lowBalanceThreshold && balance > settings.warningThreshold1) {
          const hasRecentWarning = account.notifications.some(
            n => n.type === 'LOW_BALANCE' && n.severity === 'LOW'
          )

          if (!hasRecentWarning || forceAll) {
            notificationsToCreate.push({
              type: 'LOW_BALANCE',
              title: 'اطلاعیه - کاهش موجودی',
              message: `موجودی حساب شما در حال کاهش است. موجودی فعلی: ${balance.toLocaleString('fa-IR')} تومان.`,
              severity: 'LOW',
            })
            hasIssue = true
          }
        }

        // Check for zero balance
        if (balance <= 0) {
          const hasRecentZero = account.notifications.some(
            n => n.type === 'LOW_BALANCE' && n.severity === 'CRITICAL'
          )

          if (!hasRecentZero || forceAll) {
            notificationsToCreate.push({
              type: 'LOW_BALANCE',
              title: 'موجودی حساب صفر شد',
              message: 'موجودی حساب شما به پایان رسیده است. لطفاً حساب خود را شارژ کنید.',
              severity: 'CRITICAL',
            })
            hasIssue = true

            // Suspend account if settings allow
            if (settings.suspendOnZeroBalance) {
              await db.creditAccount.update({
                where: { id: account.id },
                data: { isActive: false },
              })

              notificationsToCreate.push({
                type: 'ACCOUNT_SUSPENDED',
                title: 'حساب شما به حالت تعلیق درآمد',
                message: 'حساب اعتباری شما به دلیل عدم موجودی به حالت تعلیق درآمد. برای فعال‌سازی مجدد، حساب خود را شارژ کنید.',
                severity: 'CRITICAL',
              })
            }
          }
        }

        // Check for credit limit exceeded
        if (creditLimit > 0 && balance < -creditLimit) {
          const hasRecentLimit = account.notifications.some(
            n => n.type === 'CREDIT_LIMIT_EXCEEDED'
          )

          if (!hasRecentLimit || forceAll) {
            notificationsToCreate.push({
              type: 'CREDIT_LIMIT_EXCEEDED',
              title: 'سقف اعتبار exceeded',
              message: 'شما از سقف اعتبار خود فراتر رفته‌اید. لطفاً فوراً حساب خود را شارژ کنید.',
              severity: 'CRITICAL',
            })
            hasIssue = true
          }
        }

        // Create notifications
        for (const notificationData of notificationsToCreate) {
          await db.creditNotification.create({
            data: {
              accountId: account.id,
              ...notificationData,
            },
          })
          results.notificationsCreated++
        }

        if (hasIssue) {
          results.accountsWithIssues++
        }

      } catch (error) {
        console.error(`Error processing notifications for account ${account.id}:`, error)
        results.errors.push(`حساب ${account.user.name}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`)
      }
    }

    return NextResponse.json({
      message: 'بررسی اعلان‌ها با موفقیت انجام شد',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error checking credit account notifications:', error)
    return NextResponse.json(
      { error: 'خطا در بررسی اعلان‌های حساب‌های اعتباری' },
      { status: 500 }
    )
  }
}

// GET endpoint to get notification statistics
export async function GET(request: NextRequest) {
  try {
    // Get notification statistics
    const stats = await db.creditNotification.groupBy({
      by: ['type', 'severity'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
      },
    })

    // Get unread notifications count
    const unreadCount = await db.creditNotification.count({
      where: {
        isRead: false,
      },
    })

    // Get accounts with low balance
    const lowBalanceAccounts = await db.creditAccount.count({
      where: {
        isActive: true,
        balance: {
          lte: 10000, // Less than 10,000
        },
      },
    })

    // Get suspended accounts
    const suspendedAccounts = await db.creditAccount.count({
      where: {
        isActive: false,
      },
    })

    // Get accounts needing monthly charge
    const now = new Date()
    const accountsNeedingCharge = await db.creditAccount.count({
      where: {
        isActive: true,
        autoCharge: true,
        OR: [
          {
            lastChargedAt: {
              lt: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
          {
            nextChargeDate: {
              lte: now,
            },
          },
          {
            nextChargeDate: null,
          },
        ],
      },
    })

    return NextResponse.json({
      statistics: stats,
      unreadNotifications: unreadCount,
      lowBalanceAccounts,
      suspendedAccounts,
      accountsNeedingCharge,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error getting notification statistics:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت آمار اعلان‌ها' },
      { status: 500 }
    )
  }
}