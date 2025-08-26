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
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

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
    const where = unreadOnly ? { isRead: false } : {}

    // Fetch notifications
    const notifications = await db.creditNotification.findMany({
      where: { accountId, ...where },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Get total count
    const total = await db.creditNotification.count({
      where: { accountId, ...where },
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching credit notifications:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات اعلان‌ها' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const body = await request.json()
    const { notificationIds, action } = body

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

    if (action === 'mark_read') {
      // Mark notifications as read
      await db.creditNotification.updateMany({
        where: { 
          accountId, 
          id: { in: notificationIds }
        },
        data: { 
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند',
      })
    } else if (action === 'mark_unread') {
      // Mark notifications as unread
      await db.creditNotification.updateMany({
        where: { 
          accountId, 
          id: { in: notificationIds }
        },
        data: { 
          isRead: false,
          readAt: null,
        },
      })

      return NextResponse.json({
        message: 'اعلان‌ها به عنوان خوانده نشده علامت‌گذاری شدند',
      })
    } else if (action === 'delete') {
      // Delete notifications
      await db.creditNotification.deleteMany({
        where: { 
          accountId, 
          id: { in: notificationIds }
        },
      })

      return NextResponse.json({
        message: 'اعلان‌ها با موفقیت حذف شدند',
      })
    }

    return NextResponse.json(
      { error: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating credit notifications:', error)
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی اعلان‌ها' },
      { status: 500 }
    )
  }
}