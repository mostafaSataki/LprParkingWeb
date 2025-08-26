import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Check if account exists
    const account = await db.creditAccount.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        settings: true,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'حساب اعتباری یافت نشد' },
        { status: 404 }
      )
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get transactions
    const transactions = await db.creditTransaction.findMany({
      where: {
        accountId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get monthly charges
    const monthlyCharges = await db.monthlyCharge.findMany({
      where: {
        accountId,
        ...(Object.keys(dateFilter).length > 0 && { chargeDate: dateFilter }),
      },
      orderBy: { chargeDate: 'desc' },
    })

    // Get notifications
    const notifications = await db.creditNotification.findMany({
      where: {
        accountId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Prepare export data
    const exportData = {
      account: {
        id: account.id,
        userName: account.user.name,
        userEmail: account.user.email,
        balance: account.balance,
        monthlyLimit: account.monthlyLimit,
        creditLimit: account.creditLimit,
        warningThreshold: account.warningThreshold,
        isActive: account.isActive,
        lastChargedAt: account.lastChargedAt,
        nextChargeDate: account.nextChargeDate,
        autoCharge: account.autoCharge,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      settings: account.settings,
      transactions,
      monthlyCharges,
      notifications,
      exportDate: new Date().toISOString(),
      period: {
        start: startDate || null,
        end: endDate || null,
      },
    }

    // Format based on requested format
    switch (format) {
      case 'csv':
        return await exportToCSV(exportData)
      case 'json':
        return NextResponse.json(exportData)
      case 'pdf':
        // For PDF export, you would typically use a library like PDFKit or puppeteer
        // For now, we'll return JSON with a note
        return NextResponse.json({
          ...exportData,
          note: 'PDF export requires additional setup. Please contact administrator.',
        })
      default:
        return NextResponse.json(
          { error: 'فرمت خروجی نامعتبر است' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error exporting credit account data:', error)
    return NextResponse.json(
      { error: 'خطا در خروجی گرفتن از اطلاعات حساب' },
      { status: 500 }
    )
  }
}

async function exportToCSV(data: any) {
  // Create CSV content for transactions
  const transactionHeaders = [
    'تاریخ',
    'نوع',
    'مبلغ',
    'توضیحات',
    'موجودی قبل',
    'موجودی بعد',
    'شناسه مرجع',
  ]

  const transactionRows = data.transactions.map((t: any) => [
    new Date(t.createdAt).toLocaleString('fa-IR'),
    t.type === 'CHARGE' ? 'شارژ' :
    t.type === 'DEDUCTION' ? 'کسر' :
    t.type === 'REFUND' ? 'بازگشت' :
    t.type === 'ADJUSTMENT' ? 'تنظیم' : 'بازنشانی ماهانه',
    t.amount.toLocaleString('fa-IR'),
    t.description || '',
    t.balanceBefore.toLocaleString('fa-IR'),
    t.balanceAfter.toLocaleString('fa-IR'),
    t.referenceId || '',
  ])

  // Create CSV content for monthly charges
  const monthlyChargeHeaders = [
    'تاریخ شارژ',
    'مبلغ',
    'وضعیت',
    'تاریخ شارژ بعدی',
    'یادداشت‌ها',
  ]

  const monthlyChargeRows = data.monthlyCharges.map((c: any) => [
    new Date(c.chargeDate).toLocaleDateString('fa-IR'),
    c.amount.toLocaleString('fa-IR'),
    c.status === 'COMPLETED' ? 'تکمیل شده' :
    c.status === 'FAILED' ? 'ناموفق' :
    c.status === 'PENDING' ? 'در انتظار' : 'در حال پردازش',
    new Date(c.nextChargeDate).toLocaleDateString('fa-IR'),
    c.notes || '',
  ])

  // Create CSV content for notifications
  const notificationHeaders = [
    'تاریخ',
    'نوع',
    'عنوان',
    'پیام',
    'شدت',
    'وضعیت خواندن',
    'وضعیت ارسال',
  ]

  const notificationRows = data.notifications.map((n: any) => [
    new Date(n.createdAt).toLocaleString('fa-IR'),
    n.type,
    n.title,
    n.message,
    n.severity === 'CRITICAL' ? 'بحرانی' :
    n.severity === 'HIGH' ? 'زیاد' :
    n.severity === 'MEDIUM' ? 'متوسط' : 'کم',
    n.isRead ? 'خوانده شده' : 'خوانده نشده',
    n.isSent ? 'ارسال شده' : 'ارسال نشده',
  ])

  // Combine all sections
  const csvContent = [
    'گزارش حساب اعتباری',
    '',
    'اطلاعات حساب',
    `نام کاربر: ${data.account.userName}`,
    `ایمیل: ${data.account.userEmail}`,
    `موجودی فعلی: ${data.account.balance.toLocaleString('fa-IR')} تومان`,
    `محدودیت ماهانه: ${data.account.monthlyLimit.toLocaleString('fa-IR')} تومان`,
    `سقف اعتبار: ${data.account.creditLimit.toLocaleString('fa-IR')} تومان`,
    `وضعیت: ${data.account.isActive ? 'فعال' : 'غیرفعال'}`,
    '',
    'تراکنش‌ها',
    transactionHeaders.join(','),
    ...transactionRows.map(row => row.join(',')),
    '',
    'شارژهای ماهانه',
    monthlyChargeHeaders.join(','),
    ...monthlyChargeRows.map(row => row.join(',')),
    '',
    'اعلان‌ها',
    notificationHeaders.join(','),
    ...notificationRows.map(row => row.join(',')),
    '',
    `تاریخ خروجی: ${new Date(data.exportDate).toLocaleString('fa-IR')}`,
  ].join('\n')

  // Return as CSV file
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="credit-account-${data.account.id}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}