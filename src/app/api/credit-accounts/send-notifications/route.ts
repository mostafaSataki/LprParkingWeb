import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, channels = ['in_app'] } = body

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'شناسه اعلان‌ها الزامی است' },
        { status: 400 }
      )
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[],
    }

    // Get notifications to send
    const notifications = await db.creditNotification.findMany({
      where: {
        id: { in: notificationIds },
        isSent: false,
      },
      include: {
        account: {
          include: {
            user: true,
            settings: true,
          },
        },
      },
    })

    results.processed = notifications.length

    for (const notification of notifications) {
      try {
        const account = notification.account
        const settings = account.settings
        const user = account.user

        let emailSent = false
        let smsSent = false
        let inAppSent = false

        // Send email notification if enabled
        if (channels.includes('email') && settings?.enableEmailNotifications && user.email) {
          try {
            // Here you would integrate with your email service
            // For now, we'll just simulate it
            console.log(`Sending email to ${user.email}: ${notification.title}`)
            emailSent = true
          } catch (emailError) {
            console.error('Error sending email:', emailError)
            results.errors.push(`خطا در ارسال ایمیل به ${user.email}: ${emailError instanceof Error ? emailError.message : 'خطای ناشناخته'}`)
          }
        }

        // Send SMS notification if enabled
        if (channels.includes('sms') && settings?.enableSMSNotifications && user.phone) {
          try {
            // Here you would integrate with your SMS service
            // For now, we'll just simulate it
            console.log(`Sending SMS to ${user.phone}: ${notification.title}`)
            smsSent = true
          } catch (smsError) {
            console.error('Error sending SMS:', smsError)
            results.errors.push(`خطا در ارسال پیامک به ${user.phone}: ${smsError instanceof Error ? smsError.message : 'خطای ناشناخته'}`)
          }
        }

        // Mark in-app notification as sent
        if (channels.includes('in_app') && settings?.enableInAppNotifications) {
          inAppSent = true
        }

        // Update notification status
        const isAnySent = emailSent || smsSent || inAppSent
        if (isAnySent) {
          await db.creditNotification.update({
            where: { id: notification.id },
            data: {
              isSent: true,
              sentAt: new Date(),
            },
          })
          results.sent++
        } else {
          results.failed++
        }

        results.details.push({
          notificationId: notification.id,
          accountId: account.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          emailSent,
          smsSent,
          inAppSent,
          title: notification.title,
          message: notification.message,
        })

      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error)
        results.failed++
        results.errors.push(`خطا در ارسال اعلان ${notification.id}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`)
      }
    }

    return NextResponse.json({
      message: 'عملیات ارسال اعلان‌ها با موفقیت انجام شد',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error sending credit notifications:', error)
    return NextResponse.json(
      { error: 'خطا در ارسال اعلان‌ها' },
      { status: 500 }
    )
  }
}

// GET endpoint to get pending notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const channel = searchParams.get('channel') || 'all'

    // Build where clause
    let where: any = {
      isSent: false,
    }

    if (channel !== 'all') {
      where.account = {
        settings: {
          ...(channel === 'email' && { enableEmailNotifications: true }),
          ...(channel === 'sms' && { enableSMSNotifications: true }),
          ...(channel === 'in_app' && { enableInAppNotifications: true }),
        },
      }
    }

    // Get pending notifications
    const notifications = await db.creditNotification.findMany({
      where,
      include: {
        account: {
          include: {
            user: true,
            settings: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    // Group by severity for prioritization
    const bySeverity = {
      CRITICAL: notifications.filter(n => n.severity === 'CRITICAL'),
      HIGH: notifications.filter(n => n.severity === 'HIGH'),
      MEDIUM: notifications.filter(n => n.severity === 'MEDIUM'),
      LOW: notifications.filter(n => n.severity === 'LOW'),
    }

    // Group by type
    const byType = notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = []
      }
      acc[notification.type].push(notification)
      return acc
    }, {} as Record<string, typeof notifications>)

    return NextResponse.json({
      notifications,
      bySeverity,
      byType,
      total: notifications.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting pending notifications:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اعلان‌های در انتظار' },
      { status: 500 }
    )
  }
}