// SMS Service for sending notifications
export interface SMSConfig {
  apiKey: string;
  senderNumber: string;
  apiUrl: string;
  sandbox: boolean;
}

export interface SMSMessage {
  to: string;
  text: string;
  type: 'RESERVATION_CONFIRMATION' | 'REMINDER_24H' | 'REMINDER_1H' | 'CANCELLATION' | 'COMPLETION' | 'PAYMENT_RECEIVED' | 'GATE_ACCESS_CODE';
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  // Generate message templates
  private generateMessage(type: SMSMessage['type'], data: any): string {
    const templates = {
      RESERVATION_CONFIRMATION: `
رزرو پارکینگ شما با موفقیت ثبت شد.
کد رزرو: ${data.reservationCode}
پارکینگ: ${data.locationName} - ${data.lotName}
زمان شروع: ${data.startTime}
زمان پایان: ${data.endTime}
مبلغ: ${data.amount} تومان
جهت ورود به پارکینگ کد رزرو را ارائه دهید.
      `.trim(),
      
      REMINDER_24H: `
یادآوری رزرو پارکینگ
کد رزرو: ${data.reservationCode}
پارکینگ: ${data.locationName} - ${data.lotName}
زمان شروع: ${data.startTime}
24 ساعت دیگر زمان رزرو شما فرا می‌رسد.
      `.trim(),
      
      REMINDER_1H: `
یادآوری رزرو پارکینگ
کد رزرو: ${data.reservationCode}
پارکینگ: ${data.locationName} - ${data.lotName}
زمان شروع: ${data.startTime}
1 ساعت دیگر زمان رزرو شما فرا می‌رسد.
      `.trim(),
      
      CANCELLATION: `
رزرو پارکینگ شما لغو شد.
کد رزرو: ${data.reservationCode}
مبلغ بازگشتی: ${data.refundAmount || 0} تومان
جهت اطلاعات بیشتر با پشتیبانی تماس بگیرید.
      `.trim(),
      
      COMPLETION: `
رزرو پارکینگ شما به پایان رسید.
کد رزرو: ${data.reservationCode}
پارکینگ: ${data.locationName} - ${data.lotName}
زمان استفاده: ${data.duration} دقیقه
مبلغ پرداختی: ${data.amount} تومان
از انتخاب شما متشکریم.
      `.trim(),
      
      PAYMENT_RECEIVED: `
پرداخت رزرو پارکینگ شما با موفقیت انجام شد.
کد رزرو: ${data.reservationCode}
مبلغ پرداختی: ${data.amount} تومان
شماره پیگیری: ${data.transactionId}
      `.trim(),
      
      GATE_ACCESS_CODE: `
کد دسترسی به پارکینگ
کد رزرو: ${data.reservationCode}
کد دسترسی: ${data.accessCode}
این کد را به اپراتور ارائه دهید.
      `.trim(),
    };

    return templates[type] || '';
  }

  // Send SMS message
  async sendSMS(message: SMSMessage, data: any): Promise<SMSResponse> {
    try {
      const text = this.generateMessage(message.type, data);

      if (this.config.sandbox) {
        // Simulate SMS sending in sandbox mode
        console.log('SMS Simulation:', {
          to: message.to,
          text,
          type: message.type,
        });

        return {
          success: true,
          messageId: `SMS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        };
      }

      // Real implementation would go here
      // Example for Kavenegar SMS service
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          receptor: message.to,
          message: text,
          sender: this.config.senderNumber,
          type: 1, // Normal SMS
        }),
      });

      const result = await response.json();

      if (result.return.status === 200) {
        return {
          success: true,
          messageId: result.entries[0].messageid,
        };
      } else {
        return {
          success: false,
          errorCode: result.return.status.toString(),
          errorMessage: result.return.message || 'SMS sending failed',
        };
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'خطا در ارسال پیامک',
      };
    }
  }

  // Send reservation confirmation SMS
  async sendReservationConfirmation(reservation: any): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'RESERVATION_CONFIRMATION',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      locationName: reservation.locationName,
      lotName: reservation.lotName,
      startTime: new Date(reservation.startTime).toLocaleString('fa-IR'),
      endTime: new Date(reservation.endTime).toLocaleString('fa-IR'),
      amount: reservation.totalAmount,
    };

    return await this.sendSMS(message, data);
  }

  // Send reminder SMS (24 hours before)
  async sendReminder24h(reservation: any): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'REMINDER_24H',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      locationName: reservation.locationName,
      lotName: reservation.lotName,
      startTime: new Date(reservation.startTime).toLocaleString('fa-IR'),
    };

    return await this.sendSMS(message, data);
  }

  // Send reminder SMS (1 hour before)
  async sendReminder1h(reservation: any): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'REMINDER_1H',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      locationName: reservation.locationName,
      lotName: reservation.lotName,
      startTime: new Date(reservation.startTime).toLocaleString('fa-IR'),
    };

    return await this.sendSMS(message, data);
  }

  // Send cancellation SMS
  async sendCancellationSMS(reservation: any, refundAmount?: number): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'CANCELLATION',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      refundAmount,
    };

    return await this.sendSMS(message, data);
  }

  // Send completion SMS
  async sendCompletionSMS(reservation: any): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'COMPLETION',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      locationName: reservation.locationName,
      lotName: reservation.lotName,
      duration: reservation.duration,
      amount: reservation.totalAmount,
    };

    return await this.sendSMS(message, data);
  }

  // Send payment received SMS
  async sendPaymentReceivedSMS(reservation: any, payment: any): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'PAYMENT_RECEIVED',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      amount: payment.amount,
      transactionId: payment.transactionId,
    };

    return await this.sendSMS(message, data);
  }

  // Send gate access code SMS
  async sendGateAccessCode(reservation: any, accessCode: string): Promise<SMSResponse> {
    const message: SMSMessage = {
      to: reservation.customerPhone,
      text: '',
      type: 'GATE_ACCESS_CODE',
    };

    const data = {
      reservationCode: reservation.reservationCode,
      accessCode,
    };

    return await this.sendSMS(message, data);
  }
}

// Create SMS service instance
export const createSMSService = (config: SMSConfig) => {
  return new SMSService(config);
};

// Default configuration (should be moved to environment variables)
export const defaultSMSConfig: SMSConfig = {
  apiKey: process.env.SMS_API_KEY || 'test-api-key',
  senderNumber: process.env.SMS_SENDER_NUMBER || '10002000',
  apiUrl: process.env.SMS_API_URL || 'https://api.kavenegar.com/v1/%API_KEY%/sms/send.json',
  sandbox: process.env.NODE_ENV !== 'production',
};

// Export singleton instance
export const smsService = createSMSService(defaultSMSConfig);