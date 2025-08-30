import { ParkingSession } from '@prisma/client';

export interface HourlyTrafficData {
  hour: number;
  entries: number;
  exits: number;
  totalVehicles: number;
  revenue: number;
}

export interface DailyTrafficData {
  date: string;
  entries: number;
  exits: number;
  totalVehicles: number;
  revenue: number;
  peakHour: number;
  peakEntries: number;
}

export interface PeakTimeAnalysis {
  peakHours: Array<{
    hour: number;
    entries: number;
    exits: number;
    description: string;
  }>;
  offPeakHours: Array<{
    hour: number;
    entries: number;
    exits: number;
    description: string;
  }>;
  totalPeakTraffic: number;
  totalOffPeakTraffic: number;
  peakToOffPeakRatio: number;
}

export interface TrafficTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  description: string;
}

export class TrafficAnalysisService {
  /**
   * Generate hourly traffic analysis for a specific date
   */
  static generateHourlyAnalysis(
    sessions: ParkingSession[],
    targetDate: Date
  ): HourlyTrafficData[] {
    const hourlyData: HourlyTrafficData[] = [];
    
    // Initialize 24 hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.push({
        hour,
        entries: 0,
        exits: 0,
        totalVehicles: 0,
        revenue: 0
      });
    }

    sessions.forEach(session => {
      const entryHour = session.entryTime.getHours();
      const exitHour = session.exitTime?.getHours();
      
      // Count entries
      if (this.isSameDate(session.entryTime, targetDate)) {
        hourlyData[entryHour].entries += 1;
        hourlyData[entryHour].revenue += session.totalAmount || 0;
      }
      
      // Count exits
      if (session.exitTime && this.isSameDate(session.exitTime, targetDate)) {
        hourlyData[exitHour!].exits += 1;
      }
    });

    // Calculate total vehicles present at each hour
    hourlyData.forEach((data, hour) => {
      data.totalVehicles = this.calculateVehiclesAtHour(sessions, targetDate, hour);
    });

    return hourlyData;
  }

  /**
   * Generate daily traffic analysis for a date range
   */
  static generateDailyAnalysis(
    sessions: ParkingSession[],
    startDate: Date,
    endDate: Date
  ): DailyTrafficData[] {
    const dailyData: DailyTrafficData[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayHourlyData = this.generateHourlyAnalysis(sessions, currentDate);
      
      // Find peak hour
      const peakHourData = dayHourlyData.reduce((peak, current) => 
        current.entries > peak.entries ? current : peak
      );

      const dayData: DailyTrafficData = {
        date: dateString,
        entries: dayHourlyData.reduce((sum, hour) => sum + hour.entries, 0),
        exits: dayHourlyData.reduce((sum, hour) => sum + hour.exits, 0),
        totalVehicles: Math.max(...dayHourlyData.map(h => h.totalVehicles)),
        revenue: dayHourlyData.reduce((sum, hour) => sum + hour.revenue, 0),
        peakHour: peakHourData.hour,
        peakEntries: peakHourData.entries
      };

      dailyData.push(dayData);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyData;
  }

  /**
   * Analyze peak times and traffic patterns
   */
  static analyzePeakTimes(hourlyData: HourlyTrafficData[]): PeakTimeAnalysis {
    // Sort hours by entry count
    const sortedHours = [...hourlyData].sort((a, b) => b.entries - a.entries);
    
    // Define peak hours (top 25% of traffic)
    const peakHourCount = Math.ceil(hourlyData.length * 0.25);
    const peakHours = sortedHours.slice(0, peakHourCount);
    const offPeakHours = sortedHours.slice(peakHourCount);

    // Add descriptions based on time of day
    const enhancedPeakHours = peakHours.map(hour => ({
      ...hour,
      description: this.getTimeDescription(hour.hour)
    }));

    const enhancedOffPeakHours = offPeakHours.map(hour => ({
      ...hour,
      description: this.getTimeDescription(hour.hour)
    }));

    const totalPeakTraffic = peakHours.reduce((sum, hour) => sum + hour.entries, 0);
    const totalOffPeakTraffic = offPeakHours.reduce((sum, hour) => sum + hour.entries, 0);
    const peakToOffPeakRatio = totalOffPeakTraffic > 0 ? totalPeakTraffic / totalOffPeakTraffic : 0;

    return {
      peakHours: enhancedPeakHours,
      offPeakHours: enhancedOffPeakHours,
      totalPeakTraffic,
      totalOffPeakTraffic,
      peakToOffPeakRatio
    };
  }

  /**
   * Analyze traffic trends over time
   */
  static analyzeTrafficTrends(
    dailyData: DailyTrafficData[],
    comparisonPeriodData?: DailyTrafficData[]
  ): TrafficTrend {
    if (dailyData.length < 2) {
      return {
        trend: 'stable',
        percentage: 0,
        description: 'داده‌های کافی برای تحلیل روند موجود نیست'
      };
    }

    // Calculate average traffic for current period
    const currentAverage = dailyData.reduce((sum, day) => sum + day.entries, 0) / dailyData.length;
    
    if (comparisonPeriodData && comparisonPeriodData.length > 0) {
      // Compare with previous period
      const previousAverage = comparisonPeriodData.reduce((sum, day) => sum + day.entries, 0) / comparisonPeriodData.length;
      const changePercentage = ((currentAverage - previousAverage) / previousAverage) * 100;
      
      if (Math.abs(changePercentage) < 5) {
        return {
          trend: 'stable',
          percentage: Math.abs(changePercentage),
          description: `ترافیک در مقایسه با دوره قبل تقریباً ثابت است (${changePercentage.toFixed(1)}% تغییر)`
        };
      } else if (changePercentage > 0) {
        return {
          trend: 'increasing',
          percentage: changePercentage,
          description: `ترافیک در مقایسه با دوره قبل ${changePercentage.toFixed(1)}% افزایش یافته`
        };
      } else {
        return {
          trend: 'decreasing',
          percentage: Math.abs(changePercentage),
          description: `ترافیک در مقایسه با دوره قبل ${Math.abs(changePercentage).toFixed(1)}% کاهش یافته`
        };
      }
    } else {
      // Analyze trend within current period
      const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
      const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.entries, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.entries, 0) / secondHalf.length;
      
      const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      
      if (Math.abs(changePercentage) < 5) {
        return {
          trend: 'stable',
          percentage: Math.abs(changePercentage),
          description: `ترافیک در طول دوره ثابت است (${changePercentage.toFixed(1)}% تغییر)`
        };
      } else if (changePercentage > 0) {
        return {
          trend: 'increasing',
          percentage: changePercentage,
          description: `ترافیک در طول دوره ${changePercentage.toFixed(1)}% افزایش یافته`
        };
      } else {
        return {
          trend: 'decreasing',
          percentage: Math.abs(changePercentage),
          description: `ترافیک در طول دوره ${Math.abs(changePercentage).toFixed(1)}% کاهش یافته`
        };
      }
    }
  }

  /**
   * Generate chart data for various visualization libraries
   */
  static generateChartData(hourlyData: HourlyTrafficData[]) {
    return {
      // For Chart.js or similar libraries
      chartjs: {
        labels: hourlyData.map(h => `${h.hour}:00`),
        datasets: [
          {
            label: 'ورودی‌ها',
            data: hourlyData.map(h => h.entries),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'خروجی‌ها',
            data: hourlyData.map(h => h.exits),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'خودروهای حاضر',
            data: hourlyData.map(h => h.totalVehicles),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true
          }
        ]
      },
      
      // Raw data for custom implementations
      raw: {
        hours: hourlyData.map(h => h.hour),
        entries: hourlyData.map(h => h.entries),
        exits: hourlyData.map(h => h.exits),
        totalVehicles: hourlyData.map(h => h.totalVehicles),
        revenue: hourlyData.map(h => h.revenue)
      }
    };
  }

  // Helper methods
  private static isSameDate(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private static calculateVehiclesAtHour(
    sessions: ParkingSession[],
    date: Date,
    hour: number
  ): number {
    let count = 0;
    const targetDateTime = new Date(date);
    targetDateTime.setHours(hour, 0, 0, 0);

    sessions.forEach(session => {
      const entryTime = session.entryTime;
      const exitTime = session.exitTime;

      // Vehicle entered before or at this hour and hasn't exited yet, or exits after this hour
      if (entryTime <= targetDateTime) {
        if (!exitTime || exitTime > targetDateTime) {
          count++;
        }
      }
    });

    return count;
  }

  private static getTimeDescription(hour: number): string {
    if (hour >= 6 && hour < 10) return 'صبح (ساعات شلوغ)';
    if (hour >= 10 && hour < 14) return 'ظهر';
    if (hour >= 14 && hour < 18) return 'عصر';
    if (hour >= 18 && hour < 22) return 'عصر و شب (ساعات شلوغ)';
    if (hour >= 22 || hour < 6) return 'شب و بامداد';
    return 'صبح زود';
  }
}