import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await request.json()
    const { paymentMethod, creditAccountId, operatorId, exitImage, exitCameraId } = body

    // Get the parking session
    const session = await db.parkingSession.findUnique({
      where: { id: sessionId },
      include: {
        vehicle: true,
        tariff: true,
        creditAccount: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: ' جلسه پارکینگ یافت نشد' },
        { status: 404 }
      )
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'جلسه پارکینگ قبلاً تکمیل شده است' },
        { status: 400 }
      )
    }

    // Calculate parking duration and amount
    const exitTime = new Date()
    const entryTime = new Date(session.entryTime)
    const durationMs = exitTime.getTime() - entryTime.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    // Calculate parking fee
    let totalAmount = 0
    if (session.tariff) {
      const tariff = session.tariff
      const hours = Math.ceil(durationMinutes / 60)
      
      // Apply entrance fee
      totalAmount = tariff.entranceFee || 0
      
      // Calculate hourly rate
      if (hours > 0) {
        const billableHours = Math.max(0, hours - Math.floor((tariff.freeMinutes || 0) / 60))
        totalAmount += billableHours * (tariff.hourlyRate || 0)
      }
      
      // Apply daily cap if exists
      if (tariff.dailyCap && totalAmount > tariff.dailyCap) {
        totalAmount = tariff.dailyCap
      }
    }

    // Handle credit account payment
    if (paymentMethod === 'CREDIT' && creditAccountId) {
      const creditAccount = await db.creditAccount.findUnique({
        where: { id: creditAccountId },
        include: { settings: true },
      })

      if (!creditAccount) {
        return NextResponse.json(
          { error: 'حساب اعتباری یافت نشد' },
          { status: 404 }
        )
      }

      if (!creditAccount.isActive) {
        return NextResponse.json(
          { error: 'حساب اعتباری غیرفعال است' },
          { status: 400 }
        )
      }

      // Check if account has sufficient balance
      if (creditAccount.balance < totalAmount) {
        // Check if credit limit allows negative balance
        if (creditAccount.creditLimit > 0 && (creditAccount.balance - totalAmount) >= -creditAccount.creditLimit) {
          // Allow negative balance within credit limit
        } else {
          return NextResponse.json(
            { error: 'موجودی حساب اعتباری کافی نیست' },
            { status: 400 }
          )
        }
      }

      // Deduct amount from credit account
      const newBalance = creditAccount.balance - totalAmount

      // Create credit transaction
      await db.creditTransaction.create({
        data: {
          accountId: creditAccountId,
          amount: totalAmount,
          type: 'DEDUCTION',
          description: `کسر هزینه پارکینگ - پلاک ${session.plateNumber}`,
          referenceId: sessionId,
          balanceBefore: creditAccount.balance,
          balanceAfter: newBalance,
        },
      })

      // Update credit account balance
      await db.creditAccount.update({
        where: { id: creditAccountId },
        data: { balance: newBalance },
      })

      // Check for low balance notifications
      const settings = creditAccount.settings
      if (settings) {
        if (newBalance <= settings.criticalThreshold && newBalance > 0) {
          await db.creditNotification.create({
            data: {
              accountId: creditAccountId,
              type: 'LOW_BALANCE',
              title: 'هشدار بحرانی - موجودی بسیار کم',
              message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
              severity: 'CRITICAL',
            },
          })
        } else if (newBalance <= settings.warningThreshold2 && newBalance > settings.criticalThreshold) {
          await db.creditNotification.create({
            data: {
              accountId: creditAccountId,
              type: 'LOW_BALANCE',
              title: 'هشدار - موجودی کم',
              message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
              severity: 'HIGH',
            },
          })
        } else if (newBalance <= settings.warningThreshold1 && newBalance > settings.warningThreshold2) {
          await db.creditNotification.create({
            data: {
              accountId: creditAccountId,
              type: 'LOW_BALANCE',
              title: 'اطلاعیه - کاهش موجودی',
              message: `موجودی حساب شما به ${newBalance.toLocaleString('fa-IR')} تومان کاهش یافته است.`,
              severity: 'MEDIUM',
            },
          })
        }
      }

      // Update parking session
      const updatedSession = await db.parkingSession.update({
        where: { id: sessionId },
        data: {
          exitTime,
          exitImage,
          exitCameraId,
          status: 'COMPLETED',
          totalAmount,
          paidAmount: totalAmount,
          isPaid: true,
          paymentMethod: 'CREDIT',
          creditAccountId,
        },
      })

      // Create payment record
      await db.payment.create({
        data: {
          sessionId,
          amount: totalAmount,
          paymentMethod: 'CREDIT',
          operatorId,
          status: 'COMPLETED',
        },
      })

      return NextResponse.json({
        message: 'جلسه پارکینگ با موفقیت تکمیل شد',
        session: updatedSession,
        payment: {
          amount: totalAmount,
          method: 'CREDIT',
          newBalance,
        },
      })
    }

    // Handle other payment methods (cash, card, etc.)
    const updatedSession = await db.parkingSession.update({
      where: { id: sessionId },
      data: {
        exitTime,
        exitImage,
        exitCameraId,
        status: 'COMPLETED',
        totalAmount,
        paidAmount: totalAmount,
        isPaid: true,
        paymentMethod,
      },
    })

    // Create payment record
    await db.payment.create({
      data: {
        sessionId,
        amount: totalAmount,
        paymentMethod,
        operatorId,
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      message: 'جلسه پارکینگ با موفقیت تکمیل شد',
      session: updatedSession,
      payment: {
        amount: totalAmount,
        method: paymentMethod,
      },
    })
  } catch (error) {
    console.error('Error completing parking session:', error)
    return NextResponse.json(
      { error: 'خطا در تکمیل جلسه پارکینگ' },
      { status: 500 }
    )
  }
}