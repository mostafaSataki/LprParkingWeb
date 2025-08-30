import { ParkingSession, Payment, PaymentMethod } from '@prisma/client';

export interface MonthlyFinancialData {
  month: string;
  year: number;
  totalRevenue: number;
  totalSessions: number;
  averageSessionValue: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    pos: number;
    online: number;
    credit: number;
  };
  dailyBreakdown: DailyFinancialData[];
  growth: {
    revenueGrowth: number;
    sessionGrowth: number;
  };
}

export interface DailyFinancialData {
  date: string;
  revenue: number;
  sessions: number;
  averageValue: number;
}

export interface AnnualFinancialData {
  year: number;
  totalRevenue: number;
  totalSessions: number;
  averageSessionValue: number;
  quarterlyBreakdown: QuarterlyFinancialData[];
  monthlyBreakdown: MonthlyFinancialData[];
  paymentTrends: PaymentTrendData[];
  growth: {
    revenueGrowth: number;
    sessionGrowth: number;
  };
}

export interface QuarterlyFinancialData {
  quarter: number;
  year: number;
  totalRevenue: number;
  totalSessions: number;
  averageSessionValue: number;
  months: MonthlyFinancialData[];
}

export interface PaymentTrendData {
  month: string;
  year: number;
  paymentMethods: {
    cash: { amount: number; count: number; percentage: number };
    card: { amount: number; count: number; percentage: number };
    pos: { amount: number; count: number; percentage: number };
    online: { amount: number; count: number; percentage: number };
    credit: { amount: number; count: number; percentage: number };
  };
}

export interface FinancialSummary {
  totalRevenue: number;
  averageDailyRevenue: number;
  averageMonthlyRevenue: number;
  peakRevenueMonth: { month: string; year: number; revenue: number };
  lowestRevenueMonth: { month: string; year: number; revenue: number };
  mostPopularPaymentMethod: { method: PaymentMethod; percentage: number };
  profitabilityIndex: number;
}

export class FinancialAnalysisService {
  /**
   * Generate monthly financial analysis
   */
  static generateMonthlyAnalysis(
    sessions: (ParkingSession & { payments: Payment[] })[],
    targetMonth: number,
    targetYear: number,
    previousMonthSessions?: (ParkingSession & { payments: Payment[] })[]
  ): MonthlyFinancialData {
    const monthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.entryTime);
      return sessionDate.getMonth() === targetMonth - 1 && sessionDate.getFullYear() === targetYear;
    });

    const totalRevenue = monthSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
    const totalSessions = monthSessions.length;
    const averageSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;

    // Payment method breakdown
    const paymentMethodBreakdown = {
      cash: 0,
      card: 0,
      pos: 0,
      online: 0,
      credit: 0
    };

    monthSessions.forEach(session => {
      session.payments.forEach(payment => {
        switch (payment.paymentMethod) {
          case 'CASH':
            paymentMethodBreakdown.cash += payment.amount;
            break;
          case 'CARD':
            paymentMethodBreakdown.card += payment.amount;
            break;
          case 'POS':
            paymentMethodBreakdown.pos += payment.amount;
            break;
          case 'ONLINE':
            paymentMethodBreakdown.online += payment.amount;
            break;
          case 'CREDIT':
            paymentMethodBreakdown.credit += payment.amount;
            break;
        }
      });
    });

    // Daily breakdown
    const dailyBreakdown = this.generateDailyBreakdown(monthSessions, targetMonth, targetYear);

    // Growth calculation
    let growth = { revenueGrowth: 0, sessionGrowth: 0 };
    if (previousMonthSessions) {
      const prevRevenue = previousMonthSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
      const prevSessions = previousMonthSessions.length;
      
      if (prevRevenue > 0) {
        growth.revenueGrowth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      }
      if (prevSessions > 0) {
        growth.sessionGrowth = ((totalSessions - prevSessions) / prevSessions) * 100;
      }
    }

    return {
      month: this.getMonthName(targetMonth),
      year: targetYear,
      totalRevenue,
      totalSessions,
      averageSessionValue,
      paymentMethodBreakdown,
      dailyBreakdown,
      growth
    };
  }

  /**
   * Generate annual financial analysis
   */
  static generateAnnualAnalysis(
    sessions: (ParkingSession & { payments: Payment[] })[],
    targetYear: number,
    previousYearSessions?: (ParkingSession & { payments: Payment[] })[]
  ): AnnualFinancialData {
    const yearSessions = sessions.filter(session => {
      const sessionDate = new Date(session.entryTime);
      return sessionDate.getFullYear() === targetYear;
    });

    const totalRevenue = yearSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
    const totalSessions = yearSessions.length;
    const averageSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;

    // Monthly breakdown
    const monthlyBreakdown: MonthlyFinancialData[] = [];
    for (let month = 1; month <= 12; month++) {
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? targetYear - 1 : targetYear;
      
      let previousMonthSessions = sessions.filter(session => {
        const sessionDate = new Date(session.entryTime);
        return sessionDate.getMonth() === previousMonth - 1 && sessionDate.getFullYear() === previousYear;
      });

      const monthlyData = this.generateMonthlyAnalysis(sessions, month, targetYear, previousMonthSessions);
      monthlyBreakdown.push(monthlyData);
    }

    // Quarterly breakdown
    const quarterlyBreakdown: QuarterlyFinancialData[] = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterMonths = monthlyBreakdown.slice((quarter - 1) * 3, quarter * 3);
      const quarterRevenue = quarterMonths.reduce((sum, month) => sum + month.totalRevenue, 0);
      const quarterSessions = quarterMonths.reduce((sum, month) => sum + month.totalSessions, 0);
      const quarterAverage = quarterSessions > 0 ? quarterRevenue / quarterSessions : 0;

      quarterlyBreakdown.push({
        quarter,
        year: targetYear,
        totalRevenue: quarterRevenue,
        totalSessions: quarterSessions,
        averageSessionValue: quarterAverage,
        months: quarterMonths
      });
    }

    // Payment trends
    const paymentTrends: PaymentTrendData[] = monthlyBreakdown.map(month => ({
      month: month.month,
      year: month.year,
      paymentMethods: {
        cash: {
          amount: month.paymentMethodBreakdown.cash,
          count: this.getPaymentMethodCount(sessions, 'CASH', month.month, month.year),
          percentage: month.totalRevenue > 0 ? (month.paymentMethodBreakdown.cash / month.totalRevenue) * 100 : 0
        },
        card: {
          amount: month.paymentMethodBreakdown.card,
          count: this.getPaymentMethodCount(sessions, 'CARD', month.month, month.year),
          percentage: month.totalRevenue > 0 ? (month.paymentMethodBreakdown.card / month.totalRevenue) * 100 : 0
        },
        pos: {
          amount: month.paymentMethodBreakdown.pos,
          count: this.getPaymentMethodCount(sessions, 'POS', month.month, month.year),
          percentage: month.totalRevenue > 0 ? (month.paymentMethodBreakdown.pos / month.totalRevenue) * 100 : 0
        },
        online: {
          amount: month.paymentMethodBreakdown.online,
          count: this.getPaymentMethodCount(sessions, 'ONLINE', month.month, month.year),
          percentage: month.totalRevenue > 0 ? (month.paymentMethodBreakdown.online / month.totalRevenue) * 100 : 0
        },
        credit: {
          amount: month.paymentMethodBreakdown.credit,
          count: this.getPaymentMethodCount(sessions, 'CREDIT', month.month, month.year),
          percentage: month.totalRevenue > 0 ? (month.paymentMethodBreakdown.credit / month.totalRevenue) * 100 : 0
        }
      }
    }));

    // Growth calculation
    let growth = { revenueGrowth: 0, sessionGrowth: 0 };
    if (previousYearSessions) {
      const prevRevenue = previousYearSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
      const prevSessions = previousYearSessions.length;
      
      if (prevRevenue > 0) {
        growth.revenueGrowth = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      }
      if (prevSessions > 0) {
        growth.sessionGrowth = ((totalSessions - prevSessions) / prevSessions) * 100;
      }
    }

    return {
      year: targetYear,
      totalRevenue,
      totalSessions,
      averageSessionValue,
      quarterlyBreakdown,
      monthlyBreakdown,
      paymentTrends,
      growth
    };
  }

  /**
   * Generate financial summary
   */
  static generateFinancialSummary(
    sessions: (ParkingSession & { payments: Payment[] })[],
    startDate: Date,
    endDate: Date
  ): FinancialSummary {
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.entryTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const totalRevenue = filteredSessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDailyRevenue = daysDiff > 0 ? totalRevenue / daysDiff : 0;
    const averageMonthlyRevenue = totalRevenue / (daysDiff / 30.44); // Average days per month

    // Find peak and lowest revenue months
    const monthlyRevenues = new Map<string, number>();
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.entryTime);
      const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth() + 1}`;
      const current = monthlyRevenues.get(monthKey) || 0;
      monthlyRevenues.set(monthKey, current + (session.totalAmount || 0));
    });

    let peakRevenueMonth = { month: '', year: 0, revenue: 0 };
    let lowestRevenueMonth = { month: '', year: 0, revenue: Infinity };

    monthlyRevenues.forEach((revenue, monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      if (revenue > peakRevenueMonth.revenue) {
        peakRevenueMonth = {
          month: this.getMonthName(month),
          year,
          revenue
        };
      }
      if (revenue < lowestRevenueMonth.revenue) {
        lowestRevenueMonth = {
          month: this.getMonthName(month),
          year,
          revenue
        };
      }
    });

    // Most popular payment method
    const paymentMethodCounts = new Map<PaymentMethod, number>();
    let totalPayments = 0;

    filteredSessions.forEach(session => {
      session.payments.forEach(payment => {
        const current = paymentMethodCounts.get(payment.paymentMethod) || 0;
        paymentMethodCounts.set(payment.paymentMethod, current + 1);
        totalPayments++;
      });
    });

    let mostPopularMethod: PaymentMethod = 'CASH';
    let maxCount = 0;
    paymentMethodCounts.forEach((count, method) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopularMethod = method;
      }
    });

    const mostPopularPaymentMethod = {
      method: mostPopularMethod,
      percentage: totalPayments > 0 ? (maxCount / totalPayments) * 100 : 0
    };

    // Profitability index (simplified - could be enhanced with cost data)
    const profitabilityIndex = filteredSessions.length > 0 ? totalRevenue / filteredSessions.length : 0;

    return {
      totalRevenue,
      averageDailyRevenue,
      averageMonthlyRevenue,
      peakRevenueMonth,
      lowestRevenueMonth,
      mostPopularPaymentMethod,
      profitabilityIndex
    };
  }

  /**
   * Generate chart data for financial visualization
   */
  static generateFinancialChartData(monthlyData: MonthlyFinancialData[]) {
    return {
      // Monthly revenue chart
      monthlyRevenue: {
        labels: monthlyData.map(m => `${m.month} ${m.year}`),
        datasets: [{
          label: 'درآمد ماهانه (تومان)',
          data: monthlyData.map(m => m.totalRevenue),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }]
      },

      // Payment method breakdown pie chart
      paymentMethods: {
        labels: ['نقدی', 'کارت', 'POS', 'آنلاین', 'اعتباری'],
        datasets: [{
          data: [
            monthlyData.reduce((sum, m) => sum + m.paymentMethodBreakdown.cash, 0),
            monthlyData.reduce((sum, m) => sum + m.paymentMethodBreakdown.card, 0),
            monthlyData.reduce((sum, m) => sum + m.paymentMethodBreakdown.pos, 0),
            monthlyData.reduce((sum, m) => sum + m.paymentMethodBreakdown.online, 0),
            monthlyData.reduce((sum, m) => sum + m.paymentMethodBreakdown.credit, 0)
          ],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }]
      },

      // Sessions vs Revenue comparison
      sessionsVsRevenue: {
        labels: monthlyData.map(m => `${m.month} ${m.year}`),
        datasets: [
          {
            label: 'تعداد جلسات',
            data: monthlyData.map(m => m.totalSessions),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            yAxisID: 'y'
          },
          {
            label: 'درآمد (تومان)',
            data: monthlyData.map(m => m.totalRevenue),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            yAxisID: 'y1'
          }
        ]
      }
    };
  }

  // Helper methods
  private static generateDailyBreakdown(
    sessions: (ParkingSession & { payments: Payment[] })[],
    month: number,
    year: number
  ): DailyFinancialData[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData: DailyFinancialData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.entryTime);
        return sessionDate.toDateString() === dayDate.toDateString();
      });

      const revenue = daySessions.reduce((sum, session) => sum + (session.totalAmount || 0), 0);
      const sessionCount = daySessions.length;
      const averageValue = sessionCount > 0 ? revenue / sessionCount : 0;

      dailyData.push({
        date: dayDate.toISOString().split('T')[0],
        revenue,
        sessions: sessionCount,
        averageValue
      });
    }

    return dailyData;
  }

  private static getPaymentMethodCount(
    sessions: (ParkingSession & { payments: Payment[] })[],
    method: PaymentMethod,
    month: string,
    year: number
  ): number {
    let count = 0;
    const monthNumber = this.getMonthNumber(month);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.entryTime);
      if (sessionDate.getMonth() === monthNumber - 1 && sessionDate.getFullYear() === year) {
        session.payments.forEach(payment => {
          if (payment.paymentMethod === method) {
            count++;
          }
        });
      }
    });

    return count;
  }

  private static getMonthName(monthNumber: number): string {
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return months[monthNumber - 1] || 'نامشخص';
  }

  private static getMonthNumber(monthName: string): number {
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return months.indexOf(monthName) + 1;
  }
}