import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/reports - Generate credit account reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, startDate, endDate, accountId } = body;

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'نوع گزارش و تاریخ شروع و پایان الزامی هستند' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let reportData: any = {};

    switch (reportType) {
      case 'account_summary':
        // Account summary report
        const accountsWhere: any = {
          createdAt: {
            gte: start,
            lte: end
          }
        };

        if (accountId) {
          accountsWhere.id = accountId;
        }

        const [accounts, totalAccounts, totalBalance] = await Promise.all([
          db.creditAccount.findMany({
            where: accountsWhere,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              _count: {
                select: {
                  transactions: true,
                  sessions: true
                }
              }
            }
          }),
          db.creditAccount.count({ where: accountsWhere }),
          db.creditAccount.aggregate({
            where: accountsWhere,
            _sum: {
              balance: true
            }
          })
        ]);

        reportData = {
          accounts,
          summary: {
            totalAccounts,
            totalBalance: totalBalance._sum.balance || 0,
            averageBalance: totalAccounts > 0 ? (totalBalance._sum.balance || 0) / totalAccounts : 0
          }
        };
        break;

      case 'transaction_report':
        // Transaction report
        const transactionsWhere: any = {
          createdAt: {
            gte: start,
            lte: end
          }
        };

        if (accountId) {
          transactionsWhere.accountId = accountId;
        }

        const [transactions, transactionStats] = await Promise.all([
          db.creditTransaction.findMany({
            where: transactionsWhere,
            include: {
              account: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }),
          db.creditTransaction.groupBy({
            by: ['type'],
            where: transactionsWhere,
            _sum: {
              amount: true
            },
            _count: {
              _all: true
            }
          })
        ]);

        reportData = {
          transactions,
          stats: transactionStats
        };
        break;

      case 'usage_report':
        // Usage report
        const usageWhere: any = {
          createdAt: {
            gte: start,
            lte: end
          },
          creditAccountId: { not: null }
        };

        if (accountId) {
          usageWhere.creditAccountId = accountId;
        }

        const [sessions, usageStats] = await Promise.all([
          db.parkingSession.findMany({
            where: usageWhere,
            include: {
              creditAccount: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              },
              vehicle: {
                select: {
                  plateNumber: true,
                  vehicleType: true
                }
              }
            },
            orderBy: { entryTime: 'desc' }
          }),
          db.parkingSession.aggregate({
            where: usageWhere,
            _sum: {
              totalAmount: true
            },
            _count: {
              _all: true
            },
            _avg: {
              totalAmount: true
            }
          })
        ]);

        reportData = {
          sessions,
          stats: usageStats
        };
        break;

      default:
        return NextResponse.json(
          { error: 'نوع گزارش نامعتبر است' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      reportType,
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'خطا در生成 گزارش' },
      { status: 500 }
    );
  }
}