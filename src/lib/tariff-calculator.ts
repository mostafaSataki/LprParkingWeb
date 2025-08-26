import { VehicleType, Tariff, VehicleGroup } from '@prisma/client';

export interface CalculationResult {
  totalAmount: number;
  breakdown: {
    entranceFee: number;
    hourlyRate: number;
    dailyRate?: number;
    nightlyRate?: number;
    freeMinutes: number;
    paidMinutes: number;
    hours: number;
    days?: number;
    nights?: number;
    discounts?: number;
    caps?: {
      daily?: number;
      nightly?: number;
    };
  };
  appliedRules: string[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  rate: number;
  type: 'hourly' | 'daily' | 'nightly';
}

export class TariffCalculator {
  // Define night hours (e.g., 10 PM to 6 AM)
  private static NIGHT_START = 22; // 10 PM
  private static NIGHT_END = 6;   // 6 AM

  /**
   * Calculate parking fee based on tariff and duration
   */
  static calculateFee(
    entryTime: Date,
    exitTime: Date,
    tariff: Tariff & { group?: VehicleGroup },
    vehicleType: VehicleType
  ): CalculationResult {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    const result: CalculationResult = {
      totalAmount: 0,
      breakdown: {
        entranceFee: tariff.entranceFee || 0,
        hourlyRate: tariff.hourlyRate || 0,
        dailyRate: tariff.dailyRate || 0,
        nightlyRate: tariff.nightlyRate || 0,
        freeMinutes: tariff.freeMinutes || 0,
        paidMinutes: 0,
        hours: 0,
        days: 0,
        nights: 0,
        discounts: 0,
        caps: {
          daily: tariff.dailyCap || 0,
          nightly: tariff.nightlyCap || 0
        }
      },
      appliedRules: []
    };

    // Check if vehicle type matches tariff
    if (tariff.vehicleType !== vehicleType && (!tariff.group || tariff.group.vehicleType !== vehicleType)) {
      result.appliedRules.push('VEHICLE_TYPE_MISMATCH');
      return result;
    }

    // Check if tariff is valid for the time period
    if (entryTime < tariff.validFrom || (tariff.validTo && exitTime > tariff.validTo)) {
      result.appliedRules.push('TARIFF_NOT_VALID');
      return result;
    }

    // Calculate free minutes
    const freeMinutes = tariff.freeMinutes || 0;
    const paidMinutes = Math.max(0, durationMinutes - freeMinutes);
    result.breakdown.paidMinutes = paidMinutes;

    // Calculate time slots for different rate types
    const timeSlots = this.calculateTimeSlots(entryTime, exitTime);
    
    let totalAmount = tariff.entranceFee || 0;
    let dailyAmount = 0;
    let nightlyAmount = 0;
    let hourlyAmount = 0;

    // Process each time slot
    for (const slot of timeSlots) {
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60); // in hours
      
      switch (slot.type) {
        case 'daily':
          if (tariff.dailyRate) {
            const days = Math.ceil(slotDuration / 24);
            dailyAmount += days * tariff.dailyRate;
            result.breakdown.days = (result.breakdown.days || 0) + days;
          }
          break;
          
        case 'nightly':
          if (tariff.nightlyRate) {
            const nights = Math.ceil(slotDuration / 12); // Assume 12-hour nights
            nightlyAmount += nights * tariff.nightlyRate;
            result.breakdown.nights = (result.breakdown.nights || 0) + nights;
          }
          break;
          
        case 'hourly':
        default:
          hourlyAmount += slotDuration * tariff.hourlyRate;
          result.breakdown.hours += slotDuration;
          break;
      }
    }

    // Apply caps
    if (tariff.dailyCap && dailyAmount > tariff.dailyCap) {
      dailyAmount = tariff.dailyCap;
      result.appliedRules.push('DAILY_CAP_APPLIED');
    }

    if (tariff.nightlyCap && nightlyAmount > tariff.nightlyCap) {
      nightlyAmount = tariff.nightlyCap;
      result.appliedRules.push('NIGHTLY_CAP_APPLIED');
    }

    // Calculate total amount
    totalAmount += dailyAmount + nightlyAmount + hourlyAmount;
    
    // Apply rounding (to nearest 1000)
    totalAmount = Math.round(totalAmount / 1000) * 1000;
    
    result.totalAmount = totalAmount;
    result.breakdown.discounts = (tariff.entranceFee || 0) + (tariff.freeMinutes || 0) * (tariff.hourlyRate || 0) / 60;

    if (paidMinutes <= 0) {
      result.appliedRules.push('FREE_PARKING');
    }

    return result;
  }

  /**
   * Calculate time slots for different rate types
   */
  private static calculateTimeSlots(entryTime: Date, exitTime: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(entryTime);
    
    while (current < exitTime) {
      const slotEnd = new Date(Math.min(current.getTime() + 24 * 60 * 60 * 1000, exitTime.getTime()));
      const slotType = this.getTimeSlotType(current, slotEnd);
      
      slots.push({
        start: new Date(current),
        end: slotEnd,
        rate: 0, // Will be set by tariff
        type: slotType
      });
      
      current.setTime(slotEnd.getTime());
    }
    
    return slots;
  }

  /**
   * Determine time slot type (daily, nightly, or hourly)
   */
  private static getTimeSlotType(start: Date, end: Date): 'hourly' | 'daily' | 'nightly' {
    const startHour = start.getHours();
    const endHour = end.getHours();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // in hours
    
    // Check if it's primarily night time
    const nightHours = this.calculateNightHours(start, end);
    const nightRatio = nightHours / duration;
    
    if (nightRatio > 0.6) {
      return 'nightly';
    }
    
    // Check if it spans a full day or more
    if (duration >= 24) {
      return 'daily';
    }
    
    return 'hourly';
  }

  /**
   * Calculate number of night hours in a time period
   */
  private static calculateNightHours(start: Date, end: Date): number {
    let nightHours = 0;
    const current = new Date(start);
    
    while (current < end) {
      const hour = current.getHours();
      const isNight = hour >= this.NIGHT_START || hour < this.NIGHT_END;
      
      if (isNight) {
        const nextHour = new Date(current);
        nextHour.setHours(current.getHours() + 1);
        const slotEnd = new Date(Math.min(nextHour.getTime(), end.getTime()));
        const slotDuration = (slotEnd.getTime() - current.getTime()) / (1000 * 60 * 60);
        nightHours += slotDuration;
      }
      
      current.setHours(current.getHours() + 1);
    }
    
    return nightHours;
  }

  /**
   * Get applicable tariff for a given time and vehicle type
   */
  static getApplicableTariff(
    tariffs: (Tariff & { group?: VehicleGroup })[],
    entryTime: Date,
    vehicleType: VehicleType,
    isHoliday: boolean = false,
    isWeekend: boolean = false
  ): Tariff & { group?: VehicleGroup } | null {
    const applicableTariffs = tariffs.filter(tariff => {
      // Check vehicle type
      if (tariff.vehicleType !== vehicleType && (!tariff.group || tariff.group.vehicleType !== vehicleType)) {
        return false;
      }
      
      // Check validity period
      if (entryTime < tariff.validFrom || (tariff.validTo && entryTime > tariff.validTo)) {
        return false;
      }
      
      // Check if tariff is active
      if (!tariff.isActive) {
        return false;
      }
      
      // Check special rates
      if (isHoliday && !tariff.isHolidayRate) {
        return false;
      }
      
      if (isWeekend && !tariff.isWeekendRate) {
        return false;
      }
      
      return true;
    });

    // Prioritize special rates
    const specialTariff = applicableTariffs.find(t => t.isHolidayRate || t.isWeekendRate);
    if (specialTariff) {
      return specialTariff;
    }

    // Return first applicable regular tariff
    return applicableTariffs[0] || null;
  }

  /**
   * Calculate estimated cost for an active session
   */
  static calculateEstimatedCost(
    entryTime: Date,
    tariff: Tariff & { group?: VehicleGroup },
    vehicleType: VehicleType
  ): CalculationResult {
    const now = new Date();
    return this.calculateFee(entryTime, now, tariff, vehicleType);
  }

  /**
   * Generate detailed cost breakdown for receipt
   */
  static generateCostBreakdown(result: CalculationResult): string[] {
    const breakdown: string[] = [];
    
    if (result.breakdown.entranceFee > 0) {
      breakdown.push(`ورودیه: ${result.breakdown.entranceFee.toLocaleString()} تومان`);
    }
    
    if (result.breakdown.freeMinutes > 0) {
      breakdown.push(`دقایق رایگان: ${result.breakdown.freeMinutes} دقیقه`);
    }
    
    if (result.breakdown.hours > 0) {
      breakdown.push(`ساعتی: ${result.breakdown.hours.toFixed(1)} ساعت × ${result.breakdown.hourlyRate.toLocaleString()} = ${(result.breakdown.hours * result.breakdown.hourlyRate).toLocaleString()} تومان`);
    }
    
    if (result.breakdown.days && result.breakdown.dailyRate) {
      breakdown.push(`روزانه: ${result.breakdown.days} روز × ${result.breakdown.dailyRate.toLocaleString()} = ${(result.breakdown.days * result.breakdown.dailyRate).toLocaleString()} تومان`);
    }
    
    if (result.breakdown.nights && result.breakdown.nightlyRate) {
      breakdown.push(`شبانه: ${result.breakdown.nights} شب × ${result.breakdown.nightlyRate.toLocaleString()} = ${(result.breakdown.nights * result.breakdown.nightlyRate).toLocaleString()} تومان`);
    }
    
    if (result.breakdown.discounts && result.breakdown.discounts > 0) {
      breakdown.push(`تخفیف: ${result.breakdown.discounts.toLocaleString()} تومان`);
    }
    
    breakdown.push(`مبلغ کل: ${result.totalAmount.toLocaleString()} تومان`);
    
    return breakdown;
  }

  /**
   * Check if current time is night time
   */
  static isNightTime(date: Date = new Date()): boolean {
    const hour = date.getHours();
    return hour >= this.NIGHT_START || hour < this.NIGHT_END;
  }

  /**
   * Get next night time transition
   */
  static getNextNightTransition(date: Date = new Date()): Date {
    const hour = date.getHours();
    const result = new Date(date);
    
    if (hour >= this.NIGHT_START) {
      // Next night end
      result.setDate(result.getDate() + 1);
      result.setHours(this.NIGHT_END, 0, 0, 0);
    } else if (hour < this.NIGHT_END) {
      // Current night end
      result.setHours(this.NIGHT_END, 0, 0, 0);
    } else {
      // Next night start
      result.setHours(this.NIGHT_START, 0, 0, 0);
    }
    
    return result;
  }
}