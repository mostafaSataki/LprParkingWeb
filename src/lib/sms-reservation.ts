import { ParkingLocation, ParkingLot, ParkingSpot, Reservation, ReservationSMS } from '@prisma/client';

export interface SMSReservationRequest {
  phoneNumber: string;
  messageText: string;
  receivedAt: Date;
}

export interface SMSCommand {
  command: string;
  parameters: string[];
  isValid: boolean;
  error?: string;
}

export interface SMSReservationResponse {
  success: boolean;
  message: string;
  reservationCode?: string;
  reservationId?: string;
  error?: string;
}

export interface ReservationContext {
  phoneNumber: string;
  step: 'LOCATION' | 'DATE_TIME' | 'DURATION' | 'CONFIRMATION';
  data: {
    locationId?: string;
    startTime?: Date;
    duration?: number;
    vehiclePlate?: string;
    customerName?: string;
  };
  lastInteraction: Date;
}

export class SMSReservationService {
  private static readonly COMMANDS = {
    RESERVE: 'رزرو',
    CANCEL: 'لغو',
    STATUS: 'وضعیت',
    HELP: 'راهنما',
    LOCATIONS: 'مکانها'
  };

  private static readonly SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  
  // In-memory storage for SMS conversation contexts
  // In production, this should be stored in Redis or database
  private static contexts: Map<string, ReservationContext> = new Map();

  /**
   * Process incoming SMS for reservation
   */
  static async processSMS(request: SMSReservationRequest): Promise<SMSReservationResponse> {
    try {
      const command = this.parseCommand(request.messageText);
      const context = this.getContext(request.phoneNumber);

      // Handle different commands
      switch (command.command) {
        case this.COMMANDS.HELP:
          return this.handleHelpCommand();

        case this.COMMANDS.LOCATIONS:
          return await this.handleLocationsCommand();

        case this.COMMANDS.RESERVE:
          return await this.handleReserveCommand(command, context, request.phoneNumber);

        case this.COMMANDS.CANCEL:
          return await this.handleCancelCommand(command, request.phoneNumber);

        case this.COMMANDS.STATUS:
          return await this.handleStatusCommand(request.phoneNumber);

        default:
          // Check if user is in a conversation flow
          if (context && this.isContextValid(context)) {
            return await this.handleConversationFlow(request.messageText, context, request.phoneNumber);
          } else {
            return this.handleUnknownCommand();
          }
      }
    } catch (error) {
      console.error('SMS processing error:', error);
      return {
        success: false,
        message: 'خطا در پردازش پیام. لطفاً دوباره تلاش کنید یا "راهنما" بفرستید.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle help command
   */
  private static handleHelpCommand(): SMSReservationResponse {
    const helpText = `راهنمای رزرو پارکینگ:
• رزرو - شروع فرآیند رزرو
• لغو [کد رزرو] - لغو رزرو
• وضعیت - مشاهده رزروهای فعال
• مکانها - لیست پارکینگ‌های موجود
• راهنما - نمایش این پیام

مثال: "رزرو پارکینگ مرکزی فردا 9 صبح 2 ساعت"`;

    return {
      success: true,
      message: helpText
    };
  }

  /**
   * Handle locations command
   */
  private static async handleLocationsCommand(): Promise<SMSReservationResponse> {
    try {
      // In a real implementation, this would query the database
      const locations = await this.getAvailableLocations();
      
      if (locations.length === 0) {
        return {
          success: false,
          message: 'در حال حاضر پارکینگی موجود نیست.'
        };
      }

      let message = 'پارکینگ‌های موجود:\n';
      locations.forEach((location, index) => {
        message += `${index + 1}. ${location.name}`;
        if (location.address) {
          message += ` - ${location.address}`;
        }
        message += '\n';
      });

      return {
        success: true,
        message: message.trim()
      };
    } catch (error) {
      return {
        success: false,
        message: 'خطا در دریافت لیست پارکینگ‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle reserve command
   */
  private static async handleReserveCommand(
    command: SMSCommand,
    context: ReservationContext | null,
    phoneNumber: string
  ): Promise<SMSReservationResponse> {
    // Check if parameters are provided in the command
    if (command.parameters.length >= 3) {
      // Try to parse complete reservation request
      return await this.handleDirectReservation(command.parameters, phoneNumber);
    } else {
      // Start conversation flow
      return this.startReservationFlow(phoneNumber);
    }
  }

  /**
   * Handle direct reservation with all parameters
   */
  private static async handleDirectReservation(
    parameters: string[],
    phoneNumber: string
  ): Promise<SMSReservationResponse> {
    try {
      // Parse parameters: location, date/time, duration, optionally vehicle plate
      const [locationName, dateTime, duration, vehiclePlate] = parameters;

      // Find location
      const location = await this.findLocationByName(locationName);
      if (!location) {
        return {
          success: false,
          message: `پارکینگ "${locationName}" یافت نشد. برای مشاهده لیست پارکینگ‌ها "مکانها" بفرستید.`
        };
      }

      // Parse date and time
      const startTime = this.parseDateTime(dateTime);
      if (!startTime) {
        return {
          success: false,
          message: 'فرمت تاریخ و زمان نامعتبر است. مثال: "فردا 9 صبح" یا "1403/1/15 14:30"'
        };
      }

      // Parse duration
      const durationMinutes = this.parseDuration(duration);
      if (!durationMinutes) {
        return {
          success: false,
          message: 'مدت زمان نامعتبر است. مثال: "2 ساعت" یا "30 دقیقه"'
        };
      }

      // Create reservation
      const reservation = await this.createReservation({
        phoneNumber,
        locationId: location.id,
        startTime,
        duration: durationMinutes,
        vehiclePlate: vehiclePlate || undefined
      });

      return {
        success: true,
        message: `رزرو شما با موفقیت ثبت شد.\nکد رزرو: ${reservation.reservationCode}\nمکان: ${location.name}\nزمان: ${startTime.toLocaleDateString('fa-IR')} ${startTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}\nمدت: ${durationMinutes} دقیقه`,
        reservationCode: reservation.reservationCode,
        reservationId: reservation.id
      };
    } catch (error) {
      return {
        success: false,
        message: 'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start reservation conversation flow
   */
  private static startReservationFlow(phoneNumber: string): SMSReservationResponse {
    const context: ReservationContext = {
      phoneNumber,
      step: 'LOCATION',
      data: {},
      lastInteraction: new Date()
    };

    this.contexts.set(phoneNumber, context);

    return {
      success: true,
      message: 'لطفاً نام پارکینگ مورد نظر را وارد کنید یا "مکانها" بفرستید تا لیست پارکینگ‌ها را مشاهده کنید.'
    };
  }

  /**
   * Handle conversation flow
   */
  private static async handleConversationFlow(
    messageText: string,
    context: ReservationContext,
    phoneNumber: string
  ): Promise<SMSReservationResponse> {
    context.lastInteraction = new Date();

    switch (context.step) {
      case 'LOCATION':
        return await this.handleLocationStep(messageText, context);

      case 'DATE_TIME':
        return this.handleDateTimeStep(messageText, context);

      case 'DURATION':
        return this.handleDurationStep(messageText, context);

      case 'CONFIRMATION':
        return await this.handleConfirmationStep(messageText, context, phoneNumber);

      default:
        return this.handleUnknownCommand();
    }
  }

  /**
   * Handle location selection step
   */
  private static async handleLocationStep(
    messageText: string,
    context: ReservationContext
  ): Promise<SMSReservationResponse> {
    const location = await this.findLocationByName(messageText.trim());
    
    if (!location) {
      return {
        success: false,
        message: `پارکینگ "${messageText}" یافت نشد. لطفاً نام صحیح پارکینگ را وارد کنید یا "مکانها" بفرستید.`
      };
    }

    context.data.locationId = location.id;
    context.step = 'DATE_TIME';

    return {
      success: true,
      message: `پارکینگ ${location.name} انتخاب شد.\nلطفاً تاریخ و زمان مورد نظر را وارد کنید.\nمثال: "فردا 9 صبح" یا "1403/2/15 14:30"`
    };
  }

  /**
   * Handle date/time selection step
   */
  private static handleDateTimeStep(
    messageText: string,
    context: ReservationContext
  ): SMSReservationResponse {
    const startTime = this.parseDateTime(messageText.trim());
    
    if (!startTime) {
      return {
        success: false,
        message: 'فرمت تاریخ و زمان نامعتبر است.\nمثال‌های معتبر: "فردا 9 صبح"، "امروز 14:30"، "1403/2/15 16:00"'
      };
    }

    if (startTime <= new Date()) {
      return {
        success: false,
        message: 'زمان انتخابی باید در آینده باشد. لطفاً زمان دیگری انتخاب کنید.'
      };
    }

    context.data.startTime = startTime;
    context.step = 'DURATION';

    return {
      success: true,
      message: `زمان ${startTime.toLocaleDateString('fa-IR')} ${startTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} انتخاب شد.\nلطفاً مدت زمان پارک را وارد کنید.\nمثال: "2 ساعت"، "30 دقیقه"، "4 ساعت"`
    };
  }

  /**
   * Handle duration selection step
   */
  private static handleDurationStep(
    messageText: string,
    context: ReservationContext
  ): SMSReservationResponse {
    const duration = this.parseDuration(messageText.trim());
    
    if (!duration || duration < 30 || duration > 24 * 60) {
      return {
        success: false,
        message: 'مدت زمان نامعتبر است. حداقل 30 دقیقه و حداکثر 24 ساعت.\nمثال: "2 ساعت"، "90 دقیقه"'
      };
    }

    context.data.duration = duration;
    context.step = 'CONFIRMATION';

    const durationText = duration >= 60 
      ? `${Math.floor(duration / 60)} ساعت${duration % 60 ? ` و ${duration % 60} دقیقه` : ''}`
      : `${duration} دقیقه`;

    return {
      success: true,
      message: `اطلاعات رزرو:\n• مدت زمان: ${durationText}\n• هزینه تقریبی: محاسبه خواهد شد\n\nبرای تأیید "تایید" و برای لغو "لغو" بفرستید.`
    };
  }

  /**
   * Handle confirmation step
   */
  private static async handleConfirmationStep(
    messageText: string,
    context: ReservationContext,
    phoneNumber: string
  ): Promise<SMSReservationResponse> {
    const message = messageText.trim().toLowerCase();

    if (message === 'تایید' || message === 'تائید' || message === 'بله') {
      try {
        const reservation = await this.createReservation({
          phoneNumber: context.phoneNumber,
          locationId: context.data.locationId!,
          startTime: context.data.startTime!,
          duration: context.data.duration!,
          vehiclePlate: context.data.vehiclePlate
        });

        // Clear context
        this.contexts.delete(phoneNumber);

        const location = await this.getLocationById(context.data.locationId!);

        return {
          success: true,
          message: `رزرو شما تایید شد!\nکد رزرو: ${reservation.reservationCode}\nمکان: ${location?.name}\nزمان: ${context.data.startTime!.toLocaleDateString('fa-IR')} ${context.data.startTime!.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
          reservationCode: reservation.reservationCode,
          reservationId: reservation.id
        };
      } catch (error) {
        return {
          success: false,
          message: 'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else if (message === 'لغو' || message === 'خیر') {
      // Clear context
      this.contexts.delete(phoneNumber);
      
      return {
        success: true,
        message: 'رزرو لغو شد.'
      };
    } else {
      return {
        success: false,
        message: 'پاسخ نامعتبر. برای تأیید "تایید" و برای لغو "لغو" بفرستید.'
      };
    }
  }

  /**
   * Handle cancel command
   */
  private static async handleCancelCommand(
    command: SMSCommand,
    phoneNumber: string
  ): Promise<SMSReservationResponse> {
    if (command.parameters.length === 0) {
      return {
        success: false,
        message: 'لطفاً کد رزرو را وارد کنید. مثال: "لغو ABC123"'
      };
    }

    const reservationCode = command.parameters[0];
    
    try {
      const cancelled = await this.cancelReservation(reservationCode, phoneNumber);
      
      if (cancelled) {
        return {
          success: true,
          message: `رزرو با کد ${reservationCode} لغو شد.`
        };
      } else {
        return {
          success: false,
          message: `رزرو با کد ${reservationCode} یافت نشد یا قابل لغو نیست.`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'خطا در لغو رزرو. لطفاً دوباره تلاش کنید.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle status command
   */
  private static async handleStatusCommand(phoneNumber: string): Promise<SMSReservationResponse> {
    try {
      const reservations = await this.getActiveReservations(phoneNumber);
      
      if (reservations.length === 0) {
        return {
          success: true,
          message: 'شما رزرو فعالی ندارید.'
        };
      }

      let message = 'رزروهای فعال شما:\n';
      reservations.forEach((reservation, index) => {
        message += `${index + 1}. کد: ${reservation.reservationCode}\n`;
        message += `   زمان: ${reservation.startTime.toLocaleDateString('fa-IR')} ${reservation.startTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}\n`;
        message += `   وضعیت: ${this.getReservationStatusText(reservation.status)}\n\n`;
      });

      return {
        success: true,
        message: message.trim()
      };
    } catch (error) {
      return {
        success: false,
        message: 'خطا در دریافت وضعیت رزروها',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle unknown command
   */
  private static handleUnknownCommand(): SMSReservationResponse {
    return {
      success: false,
      message: 'دستور شناخته نشده. برای مشاهده راهنما "راهنما" بفرستید.'
    };
  }

  // Helper methods
  private static parseCommand(messageText: string): SMSCommand {
    const parts = messageText.trim().split(/\s+/);
    const command = parts[0];
    const parameters = parts.slice(1);

    return {
      command,
      parameters,
      isValid: true
    };
  }

  private static getContext(phoneNumber: string): ReservationContext | null {
    const context = this.contexts.get(phoneNumber);
    if (context && this.isContextValid(context)) {
      return context;
    }
    return null;
  }

  private static isContextValid(context: ReservationContext): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - context.lastInteraction.getTime();
    return timeDiff < this.SESSION_TIMEOUT;
  }

  private static parseDateTime(dateTimeStr: string): Date | null {
    // This is a simplified parser - in production, you'd want more robust parsing
    const now = new Date();
    
    // Handle relative dates like "فردا", "امروز"
    if (dateTimeStr.includes('امروز')) {
      const timeMatch = dateTimeStr.match(/(\d{1,2}):?(\d{2})?\s*(صبح|ظهر|عصر|شب)?/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2] || '0');
        const period = timeMatch[3];
        
        const date = new Date(now);
        date.setHours(this.convertToPersianTime(hour, period), minute, 0, 0);
        return date;
      }
    }
    
    if (dateTimeStr.includes('فردا')) {
      const timeMatch = dateTimeStr.match(/(\d{1,2}):?(\d{2})?\s*(صبح|ظهر|عصر|شب)?/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2] || '0');
        const period = timeMatch[3];
        
        const date = new Date(now);
        date.setDate(date.getDate() + 1);
        date.setHours(this.convertToPersianTime(hour, period), minute, 0, 0);
        return date;
      }
    }

    // Handle standard datetime formats
    const isoMatch = dateTimeStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/);
    if (isoMatch) {
      const [, year, month, day, hour, minute] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }

    return null;
  }

  private static convertToPersianTime(hour: number, period?: string): number {
    if (!period) return hour;
    
    switch (period) {
      case 'صبح':
        return hour === 12 ? 0 : hour;
      case 'ظهر':
        return hour === 12 ? 12 : hour + 12;
      case 'عصر':
        return hour + 12;
      case 'شب':
        return hour + 12;
      default:
        return hour;
    }
  }

  private static parseDuration(durationStr: string): number | null {
    const hourMatch = durationStr.match(/(\d+)\s*ساعت/);
    const minuteMatch = durationStr.match(/(\d+)\s*دقیقه/);
    
    let totalMinutes = 0;
    
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    return totalMinutes > 0 ? totalMinutes : null;
  }

  private static getReservationStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'در انتظار';
      case 'CONFIRMED': return 'تایید شده';
      case 'ACTIVE': return 'فعال';
      case 'COMPLETED': return 'تکمیل شده';
      case 'CANCELLED': return 'لغو شده';
      case 'NO_SHOW': return 'عدم حضور';
      case 'EXPIRED': return 'منقضی شده';
      default: return status;
    }
  }

  // Mock database methods - in production, these would use Prisma
  private static async getAvailableLocations(): Promise<ParkingLocation[]> {
    // Mock implementation
    return [
      { id: '1', name: 'پارکینگ مرکزی', address: 'خیابان ولیعصر', description: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'پارکینگ تجاری', address: 'میدان تجریش', description: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  private static async findLocationByName(name: string): Promise<ParkingLocation | null> {
    const locations = await this.getAvailableLocations();
    return locations.find(loc => loc.name.includes(name) || name.includes(loc.name)) || null;
  }

  private static async getLocationById(id: string): Promise<ParkingLocation | null> {
    const locations = await this.getAvailableLocations();
    return locations.find(loc => loc.id === id) || null;
  }

  private static async createReservation(data: {
    phoneNumber: string;
    locationId: string;
    startTime: Date;
    duration: number;
    vehiclePlate?: string;
  }): Promise<Reservation> {
    // Mock implementation - in production, this would use Prisma
    const reservationCode = this.generateReservationCode();
    const endTime = new Date(data.startTime);
    endTime.setMinutes(endTime.getMinutes() + data.duration);

    return {
      id: `res_${Date.now()}`,
      reservationCode,
      customerId: null,
      customerName: '',
      customerPhone: data.phoneNumber,
      customerEmail: null,
      vehiclePlate: data.vehiclePlate || null,
      vehicleType: 'CAR',
      spotId: null,
      lotId: 'lot_1', // Default lot
      locationId: data.locationId,
      startTime: data.startTime,
      endTime,
      duration: data.duration,
      status: 'PENDING',
      totalAmount: 0,
      paidAmount: 0,
      isPaid: false,
      paymentMethod: null,
      paymentId: null,
      notes: 'رزرو از طریق SMS',
      qrCode: null,
      smsSent: true,
      emailSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private static async cancelReservation(reservationCode: string, phoneNumber: string): Promise<boolean> {
    // Mock implementation
    return Math.random() > 0.2; // 80% success rate for demo
  }

  private static async getActiveReservations(phoneNumber: string): Promise<Reservation[]> {
    // Mock implementation
    return [];
  }

  private static generateReservationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}