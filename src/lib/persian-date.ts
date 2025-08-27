import { DateObject } from "react-multi-date-picker";
import jalaliday from "jalaliday";

export class PersianDate {
  private dateObject: DateObject;

  constructor(date?: Date | string | number) {
    // Initialize with jalali calendar using the correct API
    this.dateObject = new DateObject(date || new Date());
    // Apply jalali calendar using the plugin
    this.dateObject.convert(jalaliday);
  }

  static now(): PersianDate {
    return new PersianDate();
  }

  format(format: string): string {
    return this.dateObject.format(format);
  }

  toDate(): Date {
    return this.dateObject.toDate();
  }

  toString(): string {
    return this.dateObject.toString();
  }

  addDays(days: number): PersianDate {
    const newDate = new DateObject(this.dateObject);
    newDate.add(days, "day");
    return new PersianDate(newDate.toDate());
  }

  addHours(hours: number): PersianDate {
    const newDate = new DateObject(this.dateObject);
    newDate.add(hours, "hour");
    return new PersianDate(newDate.toDate());
  }

  addMinutes(minutes: number): PersianDate {
    const newDate = new DateObject(this.dateObject);
    newDate.add(minutes, "minute");
    return new PersianDate(newDate.toDate());
  }

  isWeekend(): boolean {
    const day = this.dateObject.day;
    return day === 6; // Friday in Jalali calendar
  }

  isHoliday(): boolean {
    // This would typically be loaded from a database of holidays
    // For now, we'll just check for weekends
    return this.isWeekend();
  }

  getDay(): number {
    return this.dateObject.day;
  }

  getMonth(): number {
    return this.dateObject.month.number;
  }

  getYear(): number {
    return this.dateObject.year;
  }

  getHours(): number {
    return this.dateObject.hour;
  }

  getMinutes(): number {
    return this.dateObject.minute;
  }

  getSeconds(): number {
    return this.dateObject.second;
  }

  diffInHours(otherDate: PersianDate): number {
    const diffMs = this.toDate().getTime() - otherDate.toDate().getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  diffInMinutes(otherDate: PersianDate): number {
    const diffMs = this.toDate().getTime() - otherDate.toDate().getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  clone(): PersianDate {
    return new PersianDate(this.toDate());
  }

  // Convert to Persian numerals
  toPersianNumerals(str: string): string {
    const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
  }

  // Format with Persian numerals
  formatPersian(format: string): string {
    const formatted = this.format(format);
    return this.toPersianNumerals(formatted);
  }

  // Static method to convert Gregorian to Persian
  static fromGregorian(date: Date | string): PersianDate {
    return new PersianDate(date);
  }

  // Static method to create from Persian date string
  static fromPersianString(dateString: string): PersianDate {
    const [year, month, day] = dateString.split("/").map(Number);
    const dateObject = new DateObject({
      year,
      month,
      day,
      calendar: "jalali"
    });
    return new PersianDate(dateObject.toDate());
  }
}

// Utility functions
export const formatPersianDate = (date: Date | string, format: string = "YYYY/MM/DD HH:mm"): string => {
  const persianDate = new PersianDate(date);
  return persianDate.formatPersian(format);
};

export const formatPersianTime = (date: Date | string): string => {
  const persianDate = new PersianDate(date);
  return persianDate.formatPersian("HH:mm");
};

export const formatPersianDateShort = (date: Date | string): string => {
  const persianDate = new PersianDate(date);
  return persianDate.formatPersian("YYYY/MM/DD");
};

export const isPersianWeekend = (date: Date | string): boolean => {
  const persianDate = new PersianDate(date);
  return persianDate.isWeekend();
};

export const isPersianHoliday = (date: Date | string): boolean => {
  const persianDate = new PersianDate(date);
  return persianDate.isHoliday();
};

// Convert numbers to Persian numerals
export const toPersianNumerals = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) {
    return "۰";
  }
  const str = num.toString();
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
};

// Convert Persian numerals to English numbers
export const fromPersianNumerals = (persianStr: string): string => {
  const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return persianStr.replace(/[۰-۹]/g, (digit) => {
    return persianNumerals.indexOf(digit).toString();
  });
};