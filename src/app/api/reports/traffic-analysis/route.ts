import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TrafficAnalysisService } from '@/lib/traffic-analysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const analysisType = searchParams.get('type') || 'hourly'; // hourly, daily, peak-times, trends

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'تاریخ شروع و پایان الزامی است' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get parking sessions within the date range
    const sessions = await prisma.parkingSession.findMany({
      where: {
        OR: [
          {
            entryTime: {
              gte: start,
              lte: end
            }
          },
          {
            exitTime: {
              gte: start,
              lte: end
            }
          }
        ]
      },
      orderBy: {
        entryTime: 'asc'
      }
    });

    let analysisResult;

    switch (analysisType) {
      case 'hourly':
        analysisResult = TrafficAnalysisService.generateHourlyAnalysis(sessions, start);
        break;

      case 'daily':
        analysisResult = TrafficAnalysisService.generateDailyAnalysis(sessions, start, end);
        break;

      case 'peak-times':
        const hourlyData = TrafficAnalysisService.generateHourlyAnalysis(sessions, start);
        analysisResult = TrafficAnalysisService.analyzePeakTimes(hourlyData);
        break;

      case 'trends':
        const dailyData = TrafficAnalysisService.generateDailyAnalysis(sessions, start, end);
        
        // Get comparison period (same length as current period, ending at start date)
        const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const comparisonStart = new Date(start);
        comparisonStart.setDate(comparisonStart.getDate() - periodLength);
        const comparisonEnd = new Date(start);
        comparisonEnd.setDate(comparisonEnd.getDate() - 1);

        const comparisonSessions = await prisma.parkingSession.findMany({
          where: {
            OR: [
              {
                entryTime: {
                  gte: comparisonStart,
                  lte: comparisonEnd
                }
              },
              {
                exitTime: {
                  gte: comparisonStart,
                  lte: comparisonEnd
                }
              }
            ]
          }
        });

        const comparisonData = TrafficAnalysisService.generateDailyAnalysis(
          comparisonSessions, 
          comparisonStart, 
          comparisonEnd
        );

        analysisResult = TrafficAnalysisService.analyzeTrafficTrends(dailyData, comparisonData);
        break;

      case 'chart-data':
        const chartHourlyData = TrafficAnalysisService.generateHourlyAnalysis(sessions, start);
        analysisResult = TrafficAnalysisService.generateChartData(chartHourlyData);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع تحلیل نامعتبر است' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        type: analysisType,
        period: {
          start: startDate,
          end: endDate
        },
        totalSessions: sessions.length,
        analysis: analysisResult
      }
    });

  } catch (error) {
    console.error('Traffic analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تحلیل ترافیک' },
      { status: 500 }
    );
  }
}