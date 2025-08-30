import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FinancialAnalysisService } from '@/lib/financial-analysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'monthly'; // monthly, annual, summary
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let analysisResult;

    // Get parking sessions with payments
    const baseQuery = {
      include: {
        payments: true
      },
      orderBy: {
        entryTime: 'asc' as const
      }
    };

    switch (analysisType) {
      case 'monthly':
        if (!month) {
          return NextResponse.json(
            { success: false, error: 'ماه برای تحلیل ماهانه الزامی است' },
            { status: 400 }
          );
        }

        // Get current month sessions
        const monthStartDate = new Date(year, month - 1, 1);
        const monthEndDate = new Date(year, month, 0);
        
        const currentMonthSessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: monthStartDate,
              lte: monthEndDate
            }
          }
        });

        // Get previous month sessions for comparison
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthStartDate = new Date(prevYear, prevMonth - 1, 1);
        const prevMonthEndDate = new Date(prevYear, prevMonth, 0);
        
        const previousMonthSessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: prevMonthStartDate,
              lte: prevMonthEndDate
            }
          }
        });

        analysisResult = FinancialAnalysisService.generateMonthlyAnalysis(
          currentMonthSessions,
          month,
          year,
          previousMonthSessions
        );
        break;

      case 'annual':
        // Get current year sessions
        const yearStartDate = new Date(year, 0, 1);
        const yearEndDate = new Date(year, 11, 31);
        
        const currentYearSessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: yearStartDate,
              lte: yearEndDate
            }
          }
        });

        // Get previous year sessions for comparison
        const prevYearStartDate = new Date(year - 1, 0, 1);
        const prevYearEndDate = new Date(year - 1, 11, 31);
        
        const previousYearSessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: prevYearStartDate,
              lte: prevYearEndDate
            }
          }
        });

        analysisResult = FinancialAnalysisService.generateAnnualAnalysis(
          currentYearSessions,
          year,
          previousYearSessions
        );
        break;

      case 'summary':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: 'تاریخ شروع و پایان برای خلاصه مالی الزامی است' },
            { status: 400 }
          );
        }

        const summaryStartDate = new Date(startDate);
        const summaryEndDate = new Date(endDate);
        
        const summarySessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: summaryStartDate,
              lte: summaryEndDate
            }
          }
        });

        analysisResult = FinancialAnalysisService.generateFinancialSummary(
          summarySessions,
          summaryStartDate,
          summaryEndDate
        );
        break;

      case 'chart-data':
        // Get data for the specified period for chart generation
        let chartStartDate: Date;
        let chartEndDate: Date;

        if (startDate && endDate) {
          chartStartDate = new Date(startDate);
          chartEndDate = new Date(endDate);
        } else if (month) {
          // Get year to date monthly data
          chartStartDate = new Date(year, 0, 1);
          chartEndDate = new Date(year, month - 1, new Date(year, month, 0).getDate());
        } else {
          // Default to current year
          chartStartDate = new Date(year, 0, 1);
          chartEndDate = new Date(year, 11, 31);
        }

        const chartSessions = await prisma.parkingSession.findMany({
          ...baseQuery,
          where: {
            entryTime: {
              gte: chartStartDate,
              lte: chartEndDate
            }
          }
        });

        // Generate monthly data for charts
        const monthlyChartData = [];
        for (let m = 1; m <= 12; m++) {
          if (new Date(year, m - 1, 1) <= chartEndDate) {
            const monthlyData = FinancialAnalysisService.generateMonthlyAnalysis(
              chartSessions,
              m,
              year
            );
            monthlyChartData.push(monthlyData);
          }
        }

        analysisResult = FinancialAnalysisService.generateFinancialChartData(monthlyChartData);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع تحلیل نامعتبر است' },
          { status: 400 }
        );
    }

    // Get additional context data
    const totalSessions = await prisma.parkingSession.count();
    const totalRevenue = await prisma.parkingSession.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        type: analysisType,
        context: {
          year,
          month,
          totalSessions,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          generatedAt: new Date().toISOString()
        },
        analysis: analysisResult
      }
    });

  } catch (error) {
    console.error('Financial analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تحلیل مالی' },
      { status: 500 }
    );
  }
}