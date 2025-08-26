import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { forceAll = false } = body

    const now = new Date()
    const currentDay = now.getDate()
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Get all accounts that need monthly charging
    const accounts = await db.creditAccount.findMany({
      where: {
        isActive: true,
        autoCharge: true,
        ...(forceAll ? {} : {
          OR: [
            // Accounts that haven't been charged this month
            { 
              lastChargedAt: { 
                lt: new Date(now.getFullYear(), now.getMonth(), 1) 
              } 
            },
            // Accounts with next charge date today or in the past
            {
              nextChargeDate: {
                lte: now
              }
            },
            // Accounts without next charge date set
            {
              nextChargeDate: null
            }
          ]
        }),
      },
      include: {
        settings: true,
        user: true,
      },
    })

    results.processed = accounts.length

    for (const account of accounts) {
      try {
        const settings = account.settings
        if (!settings || !settings.autoMonthlyCharge) {
          results.skipped++
          continue
        }

        // Check if today is the charge day or if we should charge
        const shouldCharge = forceAll || 
          currentDay === settings.chargeDayOfMonth ||
          (account.nextChargeDate && account.nextChargeDate <= now) ||
          !account.nextChargeDate

        if (!shouldCharge) {
          results.skipped++
          continue
        }

        const chargeAmount = settings.monthlyChargeAmount

        // Create monthly charge record
        const monthlyCharge = await db.monthlyCharge.create({
          data: {
            accountId: account.id,
            amount: chargeAmount,
            chargeDate: now,
            nextChargeDate: calculateNextChargeDate(settings.chargeDayOfMonth),
            status: 'PROCESSING',
            notes: 'شارژ ماهانه خودکار',
          },
        })

        // Calculate new balance
        const newBalance = account.balance + chargeAmount

        // Create transaction
        const transaction = await db.creditTransaction.create({
          data: {
            accountId: account.id,
            amount: chargeAmount,
            type: 'CHARGE',
            description: 'شارژ ماهانه خودکار',
            balanceBefore: account.balance,
            balanceAfter: newBalance,
          },
        })

        // Update account
        await db.creditAccount.update({
          where: { id: account.id },
          data: {
            balance: newBalance,
            lastChargedAt: now,
            nextChargeDate: calculateNextChargeDate(settings.chargeDayOfMonth),
          },
        })

        // Update monthly charge status
        await db.monthlyCharge.update({
          where: { id: monthlyCharge.id },
          data: {
            status: 'COMPLETED',
            transactionId: transaction.id,
          },
        })

        // Create success notification
        await db.creditNotification.create({
          data: {
            accountId: account.id,
            type: 'MONTHLY_CHARGE_SUCCESS',
            title: 'شارژ ماهانه با موفقیت انجام شد',
            message: `حساب شما به مبلغ ${chargeAmount.toLocaleString('fa-IR')} تومان به صورت خودکار شارژ شد. موجودی جدید: ${newBalance.toLocaleString('fa-IR')} تومان.`,
            severity: 'LOW',
          },
        })

        results.successful++

      } catch (error) {
        console.error(`Error processing monthly charge for account ${account.id}:`, error)
        
        // Update monthly charge status to failed if it was created
        try {
          await db.monthlyCharge.updateMany({
            where: { 
              accountId: account.id,
              status: 'PROCESSING',
            },
            data: {
              status: 'FAILED',
              notes: `خطا: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`,
            },
          })
        } catch (updateError) {
          console.error('Error updating monthly charge status:', updateError)
        }

        // Create failure notification
        try {
          await db.creditNotification.create({
            data: {
              accountId: account.id,
              type: 'MONTHLY_CHARGE_FAILED',
              title: 'خطا در شارژ ماهانه',
              message: 'متأسفانه در شارژ ماهانه حساب شما خطایی رخ داد. لطفاً با پشتیبانی تماس بگیرید.',
              severity: 'HIGH',
            },
          })
        } catch (notificationError) {
          console.error('Error creating failure notification:', notificationError)
        }

        results.failed++
        results.errors.push(`حساب ${account.user.name}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`)
      }
    }

    return NextResponse.json({
      message: 'عملیات شارژ ماهانه با موفقیت انجام شد',
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error in monthly charge process:', error)
    return NextResponse.json(
      { error: 'خطا در اجرای عملیات شارژ ماهانه' },
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

// GET endpoint to check which accounts need charging
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const currentDay = now.getDate()

    // Get accounts that need monthly charging
    const accounts = await db.creditAccount.findMany({
      where: {
        isActive: true,
        autoCharge: true,
        OR: [
          // Accounts that haven't been charged this month
          { 
            lastChargedAt: { 
              lt: new Date(now.getFullYear(), now.getMonth(), 1) 
            } 
          },
          // Accounts with next charge date today or in the past
          {
            nextChargeDate: {
              lte: now
            }
          },
          // Accounts without next charge date set
          {
            nextChargeDate: null
          }
        ]
      },
      include: {
        settings: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Filter accounts based on their charge day
    const accountsToCharge = accounts.filter(account => {
      if (!account.settings || !account.settings.autoMonthlyCharge) {
        return false
      }
      
      return currentDay === account.settings.chargeDayOfMonth ||
             (account.nextChargeDate && account.nextChargeDate <= now) ||
             !account.nextChargeDate
    })

    return NextResponse.json({
      totalAccounts: accounts.length,
      accountsToCharge: accountsToCharge.length,
      accounts: accountsToCharge.map(account => ({
        id: account.id,
        userName: account.user.name,
        userEmail: account.user.email,
        balance: account.balance,
        monthlyChargeAmount: account.settings?.monthlyChargeAmount || 0,
        chargeDayOfMonth: account.settings?.chargeDayOfMonth || 1,
        lastChargedAt: account.lastChargedAt,
        nextChargeDate: account.nextChargeDate,
      })),
      currentDate: now.toISOString(),
      currentDay,
    })
  } catch (error) {
    console.error('Error checking monthly charge status:', error)
    return NextResponse.json(
      { error: 'خطا در بررسی وضعیت شارژ ماهانه' },
      { status: 500 }
    )
  }
}