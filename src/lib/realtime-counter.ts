import { RealTimeCounter, VehicleType } from '@prisma/client';

export interface CounterData {
  totalCapacity: number;
  occupiedSpaces: number;
  availableSpaces: number;
  entriesToday: number;
  exitsToday: number;
  revenueToday: number;
  lastUpdated: Date;
  utilizationRate: number; // percentage
  hourlyStats: Array<{
    hour: number;
    entries: number;
    exits: number;
    revenue: number;
  }>;
  vehicleTypeBreakdown: Record<VehicleType, {
    count: number;
    percentage: number;
  }>;
  currentSessions: Array<{
    plateNumber: string;
    vehicleType: VehicleType;
    entryTime: Date;
    duration: number;
    estimatedAmount: number;
  }>;
}

export interface CounterUpdate {
  type: 'ENTRY' | 'EXIT';
  plateNumber: string;
  vehicleType: VehicleType;
  timestamp: Date;
  amount?: number;
}

export interface CounterConfig {
  totalCapacity: number;
  updateInterval: number; // in milliseconds
  retainHistory: number; // in hours
  enableRealTimeUpdates: boolean;
  enableNotifications: boolean;
  notificationThresholds: {
    highUtilization: number; // percentage
    lowAvailability: number; // number of spaces
  };
}

export class RealTimeCounterService {
  private static instance: RealTimeCounterService;
  private config: CounterConfig;
  private currentData: CounterData;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(data: CounterData) => void> = [];
  private isRunning = false;

  private constructor() {
    this.initializeDefaultConfig();
    this.initializeCurrentData();
  }

  static getInstance(): RealTimeCounterService {
    if (!RealTimeCounterService.instance) {
      RealTimeCounterService.instance = new RealTimeCounterService();
    }
    return RealTimeCounterService.instance;
  }

  /**
   * Initialize default configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      totalCapacity: 100,
      updateInterval: 5000, // 5 seconds
      retainHistory: 24, // 24 hours
      enableRealTimeUpdates: true,
      enableNotifications: true,
      notificationThresholds: {
        highUtilization: 85, // 85%
        lowAvailability: 10 // 10 spaces
      }
    };
  }

  /**
   * Initialize current data
   */
  private initializeCurrentData(): void {
    const now = new Date();
    
    this.currentData = {
      totalCapacity: this.config.totalCapacity,
      occupiedSpaces: 67,
      availableSpaces: this.config.totalCapacity - 67,
      entriesToday: 156,
      exitsToday: 142,
      revenueToday: 2850000,
      lastUpdated: now,
      utilizationRate: 67,
      hourlyStats: this.generateMockHourlyStats(),
      vehicleTypeBreakdown: {
        CAR: { count: 55, percentage: 82 },
        MOTORCYCLE: { count: 10, percentage: 15 },
        TRUCK: { count: 2, percentage: 3 },
        BUS: { count: 0, percentage: 0 },
        VAN: { count: 0, percentage: 0 }
      },
      currentSessions: this.generateMockCurrentSessions()
    };
  }

  /**
   * Start real-time counter
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.config.enableRealTimeUpdates) {
      this.updateInterval = setInterval(() => {
        this.updateCounter();
      }, this.config.updateInterval);
    }
  }

  /**
   * Stop real-time counter
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current counter data
   */
  getCurrentData(): CounterData {
    return { ...this.currentData };
  }

  /**
   * Subscribe to counter updates
   */
  subscribe(callback: (data: CounterData) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Process entry event
   */
  processEntry(update: Omit<CounterUpdate, 'type'>): void {
    const entryUpdate: CounterUpdate = {
      type: 'ENTRY',
      ...update
    };
    
    this.updateCounterWithEvent(entryUpdate);
  }

  /**
   * Process exit event
   */
  processExit(update: Omit<CounterUpdate, 'type'>): void {
    const exitUpdate: CounterUpdate = {
      type: 'EXIT',
      ...update
    };
    
    this.updateCounterWithEvent(exitUpdate);
  }

  /**
   * Update counter with event
   */
  private updateCounterWithEvent(update: CounterUpdate): void {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Update basic counters
    if (update.type === 'ENTRY') {
      this.currentData.occupiedSpaces = Math.min(
        this.currentData.occupiedSpaces + 1,
        this.config.totalCapacity
      );
      this.currentData.entriesToday++;
      
      // Update hourly stats
      const hourlyStat = this.currentData.hourlyStats.find(s => s.hour === currentHour);
      if (hourlyStat) {
        hourlyStat.entries++;
      }
      
      // Add to current sessions
      this.currentData.currentSessions.push({
        plateNumber: update.plateNumber,
        vehicleType: update.vehicleType,
        entryTime: update.timestamp,
        duration: 0,
        estimatedAmount: 0
      });
      
      // Update vehicle type breakdown
      this.updateVehicleTypeBreakdown(update.vehicleType, 1);
      
    } else if (update.type === 'EXIT') {
      this.currentData.occupiedSpaces = Math.max(
        this.currentData.occupiedSpaces - 1,
        0
      );
      this.currentData.exitsToday++;
      
      if (update.amount) {
        this.currentData.revenueToday += update.amount;
      }
      
      // Update hourly stats
      const hourlyStat = this.currentData.hourlyStats.find(s => s.hour === currentHour);
      if (hourlyStat) {
        hourlyStat.exits++;
        if (update.amount) {
          hourlyStat.revenue += update.amount;
        }
      }
      
      // Remove from current sessions
      this.currentData.currentSessions = this.currentData.currentSessions.filter(
        session => session.plateNumber !== update.plateNumber
      );
      
      // Update vehicle type breakdown
      this.updateVehicleTypeBreakdown(update.vehicleType, -1);
    }
    
    // Update derived values
    this.currentData.availableSpaces = this.config.totalCapacity - this.currentData.occupiedSpaces;
    this.currentData.utilizationRate = Math.round(
      (this.currentData.occupiedSpaces / this.config.totalCapacity) * 100
    );
    this.currentData.lastUpdated = now;
    
    // Update session durations
    this.updateSessionDurations();
    
    // Check notifications
    if (this.config.enableNotifications) {
      this.checkNotifications();
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Update counter (periodic update)
   */
  private updateCounter(): void {
    const now = new Date();
    
    // Update session durations
    this.updateSessionDurations();
    
    // Update last updated time
    this.currentData.lastUpdated = now;
    
    // Simulate some random activity for demo
    if (Math.random() < 0.1) { // 10% chance of random update
      this.simulateRandomActivity();
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Update session durations
   */
  private updateSessionDurations(): void {
    const now = new Date();
    
    this.currentData.currentSessions.forEach(session => {
      session.duration = Math.floor(
        (now.getTime() - session.entryTime.getTime()) / (1000 * 60)
      );
      
      // Estimate amount based on duration
      session.estimatedAmount = this.estimateSessionAmount(session.duration, session.vehicleType);
    });
  }

  /**
   * Update vehicle type breakdown
   */
  private updateVehicleTypeBreakdown(vehicleType: VehicleType, change: number): void {
    const breakdown = this.currentData.vehicleTypeBreakdown[vehicleType];
    if (breakdown) {
      breakdown.count = Math.max(0, breakdown.count + change);
      
      // Recalculate percentages
      const totalVehicles = Object.values(this.currentData.vehicleTypeBreakdown)
        .reduce((sum, item) => sum + item.count, 0);
      
      Object.values(this.currentData.vehicleTypeBreakdown).forEach(item => {
        item.percentage = totalVehicles > 0 ? 
          Math.round((item.count / totalVehicles) * 100) : 0;
      });
    }
  }

  /**
   * Estimate session amount
   */
  private estimateSessionAmount(duration: number, vehicleType: VehicleType): number {
    const baseRates = {
      CAR: 3000,
      MOTORCYCLE: 1500,
      TRUCK: 5000,
      BUS: 4000,
      VAN: 3500
    };
    
    const freeMinutes = 15;
    const paidMinutes = Math.max(0, duration - freeMinutes);
    const hourlyRate = baseRates[vehicleType] || baseRates.CAR;
    
    return Math.round((paidMinutes / 60) * hourlyRate / 1000) * 1000;
  }

  /**
   * Check for notifications
   */
  private checkNotifications(): void {
    const { utilizationRate, availableSpaces } = this.currentData;
    const { highUtilization, lowAvailability } = this.config.notificationThresholds;
    
    if (utilizationRate >= highUtilization) {
      this.notifySubscribers('HIGH_UTILIZATION', {
        message: `ظرفیت پارکینگ در حال پر شدن است: ${utilizationRate}%`,
        severity: 'warning'
      });
    }
    
    if (availableSpaces <= lowAvailability) {
      this.notifySubscribers('LOW_AVAILABILITY', {
        message: `تعداد کمی جای خالی باقی مانده: ${availableSpaces} جای`,
        severity: 'warning'
      });
    }
  }

  /**
   * Notify subscribers with optional event type
   */
  private notifySubscribers(eventType?: string, data?: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error('Error in counter subscriber callback:', error);
      }
    });
  }

  /**
   * Simulate random activity for demo
   */
  private simulateRandomActivity(): void {
    const activities = ['ENTRY', 'EXIT'];
    const vehicleTypes: VehicleType[] = ['CAR', 'MOTORCYCLE', 'TRUCK'];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const plateNumber = this.generateRandomPlateNumber();
    
    const update: CounterUpdate = {
      type: activity as 'ENTRY' | 'EXIT',
      plateNumber,
      vehicleType,
      timestamp: new Date(),
      amount: activity === 'EXIT' ? Math.floor(Math.random() * 50000) + 5000 : undefined
    };
    
    this.updateCounterWithEvent(update);
  }

  /**
   * Generate random plate number
   */
  private generateRandomPlateNumber(): string {
    const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const letters = ['ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن'];
    
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Array.from({ length: 7 }, () => 
      persianNumerals[Math.floor(Math.random() * 10)]
    ).join('');
    
    return `${letter}${numbers}`;
  }

  /**
   * Generate mock hourly stats
   */
  private generateMockHourlyStats(): Array<{
    hour: number;
    entries: number;
    exits: number;
    revenue: number;
  }> {
    const stats = [];
    
    for (let hour = 0; hour < 24; hour++) {
      stats.push({
        hour,
        entries: Math.floor(Math.random() * 20),
        exits: Math.floor(Math.random() * 18),
        revenue: Math.floor(Math.random() * 100000)
      });
    }
    
    return stats;
  }

  /**
   * Generate mock current sessions
   */
  private generateMockCurrentSessions(): Array<{
    plateNumber: string;
    vehicleType: VehicleType;
    entryTime: Date;
    duration: number;
    estimatedAmount: number;
  }> {
    const sessions = [];
    const vehicleTypes: VehicleType[] = ['CAR', 'MOTORCYCLE', 'TRUCK'];
    
    for (let i = 0; i < 20; i++) {
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const entryTime = new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000);
      const duration = Math.floor((Date.now() - entryTime.getTime()) / (1000 * 60));
      
      sessions.push({
        plateNumber: this.generateRandomPlateNumber(),
        vehicleType,
        entryTime,
        duration,
        estimatedAmount: this.estimateSessionAmount(duration, vehicleType)
      });
    }
    
    return sessions;
  }

  /**
   * Get counter statistics
   */
  getStatistics(): {
    averageDailyEntries: number;
    averageDailyExits: number;
    averageDailyRevenue: number;
    peakHour: { hour: number; entries: number };
    busiestDayOfWeek: string;
    utilizationTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    const hourlyStats = this.currentData.hourlyStats;
    const totalEntries = hourlyStats.reduce((sum, stat) => sum + stat.entries, 0);
    const totalExits = hourlyStats.reduce((sum, stat) => sum + stat.exits, 0);
    const totalRevenue = hourlyStats.reduce((sum, stat) => sum + stat.revenue, 0);
    
    const peakHour = hourlyStats.reduce((max, stat) => 
      stat.entries > max.entries ? stat : max, hourlyStats[0]
    );
    
    return {
      averageDailyEntries: Math.round(totalEntries / 24),
      averageDailyExits: Math.round(totalExits / 24),
      averageDailyRevenue: Math.round(totalRevenue / 24),
      peakHour,
      busiestDayOfWeek: 'شنبه', // Mock data
      utilizationTrend: 'stable' // Mock data
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CounterConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart service if needed
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CounterConfig {
    return { ...this.config };
  }

  /**
   * Reset daily counters
   */
  resetDailyCounters(): void {
    this.currentData.entriesToday = 0;
    this.currentData.exitsToday = 0;
    this.currentData.revenueToday = 0;
    
    // Reset hourly stats
    this.currentData.hourlyStats = this.generateMockHourlyStats();
    
    this.notifySubscribers();
  }
}