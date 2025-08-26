import { PersianDate } from './persian-date';
import { toPersianNumerals } from './persian-date';

export interface PaymentRequest {
  sessionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operatorId?: string;
  shiftId?: string;
  cardNumber?: string;
  transactionId?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  receiptNumber?: string;
  transactionId?: string;
  message: string;
  error?: string;
  receiptData?: string;
}

export interface POSStatus {
  isConnected: boolean;
  lastTransaction?: Date;
  pendingTransactions: number;
  totalAmount: number;
  error?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  config: any;
  priority: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  POS = 'POS',
  ONLINE = 'ONLINE',
  CREDIT = 'CREDIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export class PaymentService {
  private static instance: PaymentService;
  private posDevices: Map<string, POSDevice> = new Map();
  private paymentQueue: PaymentRequest[] = [];
  private isProcessing: boolean = false;

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process a payment request
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate request
      if (!request.sessionId || !request.amount || request.amount <= 0) {
        return {
          success: false,
          message: 'پارامترهای پرداخت نامعتبر است'
        };
      }

      // Generate payment ID and receipt number
      const paymentId = this.generatePaymentId();
      const receiptNumber = this.generateReceiptNumber();

      // Process based on payment method
      let result: PaymentResponse;

      switch (request.paymentMethod) {
        case PaymentMethod.CASH:
          result = await this.processCashPayment(request, paymentId, receiptNumber);
          break;
        case PaymentMethod.CARD:
          result = await this.processCardPayment(request, paymentId, receiptNumber);
          break;
        case PaymentMethod.POS:
          result = await this.processPOSPayment(request, paymentId, receiptNumber);
          break;
        case PaymentMethod.ONLINE:
          result = await this.processOnlinePayment(request, paymentId, receiptNumber);
          break;
        case PaymentMethod.CREDIT:
          result = await this.processCreditPayment(request, paymentId, receiptNumber);
          break;
        default:
          result = {
            success: false,
            message: 'روش پرداخت نامعتبر است'
          };
      }

      if (result.success) {
        // Generate receipt data
        result.receiptData = this.generateReceipt({
          ...request,
          paymentId,
          receiptNumber,
          timestamp: new Date()
        });
      }

      return result;

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: 'خطا در پردازش پرداخت'
      };
    }
  }

  /**
   * Process cash payment
   */
  private async processCashPayment(
    request: PaymentRequest,
    paymentId: string,
    receiptNumber: string
  ): Promise<PaymentResponse> {
    // Simulate cash payment processing
    await this.delay(1000);

    return {
      success: true,
      paymentId,
      receiptNumber,
      message: 'پرداخت نقدی با موفقیت انجام شد'
    };
  }

  /**
   * Process card payment
   */
  private async processCardPayment(
    request: PaymentRequest,
    paymentId: string,
    receiptNumber: string
  ): Promise<PaymentResponse> {
    // Simulate card payment processing
    await this.delay(2000);

    // Validate card number if provided
    if (request.cardNumber && !this.validateCardNumber(request.cardNumber)) {
      return {
        success: false,
        message: 'شماره کارت نامعتبر است'
      };
    }

    const transactionId = this.generateTransactionId();

    return {
      success: true,
      paymentId,
      receiptNumber,
      transactionId,
      message: 'پرداخت کارتی با موفقیت انجام شد'
    };
  }

  /**
   * Process POS payment
   */
  private async processPOSPayment(
    request: PaymentRequest,
    paymentId: string,
    receiptNumber: string
  ): Promise<PaymentResponse> {
    // Get available POS device
    const posDevice = this.getAvailablePOSDevice();
    if (!posDevice) {
      return {
        success: false,
        message: 'دستگاه POS در دسترس نیست'
      };
    }

    try {
      // Send amount to POS device
      const posResult = await posDevice.processPayment(request.amount);
      
      if (posResult.success) {
        return {
          success: true,
          paymentId,
          receiptNumber,
          transactionId: posResult.transactionId,
          message: 'پرداخت POS با موفقیت انجام شد'
        };
      } else {
        return {
          success: false,
          message: posResult.message || 'خطا در پرداخت POS'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'خطا در ارتباط با دستگاه POS'
      };
    }
  }

  /**
   * Process online payment
   */
  private async processOnlinePayment(
    request: PaymentRequest,
    paymentId: string,
    receiptNumber: string
  ): Promise<PaymentResponse> {
    // Simulate online payment processing
    await this.delay(3000);

    const transactionId = this.generateTransactionId();

    return {
      success: true,
      paymentId,
      receiptNumber,
      transactionId,
      message: 'پرداخت آنلاین با موفقیت انجام شد'
    };
  }

  /**
   * Process credit payment
   */
  private async processCreditPayment(
    request: PaymentRequest,
    paymentId: string,
    receiptNumber: string
  ): Promise<PaymentResponse> {
    // Simulate credit payment processing
    await this.delay(1500);

    return {
      success: true,
      paymentId,
      receiptNumber,
      message: 'پرداخت اعتباری با موفقیت انجام شد'
    };
  }

  /**
   * Get POS device status
   */
  async getPOSStatus(deviceId?: string): Promise<POSStatus> {
    const device = deviceId ? this.posDevices.get(deviceId) : this.getDefaultPOSDevice();
    
    if (!device) {
      return {
        isConnected: false,
        pendingTransactions: 0,
        totalAmount: 0,
        error: 'دستگاه POS یافت نشد'
      };
    }

    return await device.getStatus();
  }

  /**
   * Add POS device
   */
  addPOSDevice(device: POSDevice): void {
    this.posDevices.set(device.id, device);
  }

  /**
   * Remove POS device
   */
  removePOSDevice(deviceId: string): void {
    this.posDevices.delete(deviceId);
  }

  /**
   * Get available POS device
   */
  private getAvailablePOSDevice(): POSDevice | null {
    for (const device of this.posDevices.values()) {
      if (device.isAvailable()) {
        return device;
      }
    }
    return null;
  }

  /**
   * Get default POS device
   */
  private getDefaultPOSDevice(): POSDevice | null {
    const devices = Array.from(this.posDevices.values());
    return devices.length > 0 ? devices[0] : null;
  }

  /**
   * Process payment queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.paymentQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.paymentQueue.length > 0) {
      const request = this.paymentQueue.shift();
      if (request) {
        try {
          await this.processPayment(request);
        } catch (error) {
          console.error('Error processing queued payment:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Queue payment for offline processing
   */
  queuePayment(request: PaymentRequest): void {
    this.paymentQueue.push(request);
    this.processQueue();
  }

  /**
   * Generate payment ID
   */
  private generatePaymentId(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate receipt number
   */
  private generateReceiptNumber(): string {
    const date = new PersianDate();
    const dateStr = date.format('YYYYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${dateStr}${random}`;
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate card number
   */
  private validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it's all digits and has valid length
    if (!/^\d+$/.test(cleaned) || cleaned.length < 16 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Generate receipt
   */
  private generateReceipt(data: any): string {
    const persianDate = new PersianDate(data.timestamp);
    
    const receipt = [
      'رسید پرداخت پارکینگ هوشمند',
      '=========================',
      `شماره رسید: ${data.receiptNumber}`,
      `شماره پرداخت: ${data.paymentId}`,
      data.transactionId ? `شماره تراکنش: ${data.transactionId}` : '',
      `مبلغ: ${toPersianNumerals(data.amount.toLocaleString())} تومان`,
      `روش پرداخت: ${this.getPaymentMethodLabel(data.paymentMethod)}`,
      `تاریخ: ${persianDate.formatPersian('YYYY/MM/DD HH:mm:ss')}`,
      '=========================',
      'با تشکر از پرداخت شما',
    ].filter(line => line.trim() !== '');

    return receipt.join('\n');
  }

  /**
   * Get payment method label
   */
  private getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
      [PaymentMethod.CASH]: 'نقدی',
      [PaymentMethod.CARD]: 'کارت',
      [PaymentMethod.POS]: 'POS',
      [PaymentMethod.ONLINE]: 'آنلاین',
      [PaymentMethod.CREDIT]: 'اعتباری'
    };
    return labels[method] || method;
  }

  /**
   * Simulate delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * POS Device class
 */
export class POSDevice {
  constructor(
    public id: string,
    public name: string,
    public ipAddress: string,
    public port: number
  ) {}

  async processPayment(amount: number): Promise<{ success: boolean; transactionId?: string; message: string }> {
    try {
      // Simulate POS communication
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        return {
          success: true,
          transactionId: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          message: 'پرداخت با موفقیت انجام شد'
        };
      } else {
        return {
          success: false,
          message: 'خطا در پرداخت POS'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'خطا در ارتباط با دستگاه POS'
      };
    }
  }

  async getStatus(): Promise<POSStatus> {
    try {
      // Simulate POS status check
      await new Promise(resolve => setTimeout(resolve, 500));

      const isConnected = Math.random() > 0.1; // 90% uptime

      return {
        isConnected,
        lastTransaction: isConnected ? new Date() : undefined,
        pendingTransactions: isConnected ? Math.floor(Math.random() * 5) : 0,
        totalAmount: isConnected ? Math.floor(Math.random() * 1000000) : 0,
        error: isConnected ? undefined : 'دستگاه متصل نیست'
      };
    } catch (error) {
      return {
        isConnected: false,
        pendingTransactions: 0,
        totalAmount: 0,
        error: 'خطا در دریافت وضعیت دستگاه'
      };
    }
  }

  isAvailable(): boolean {
    return Math.random() > 0.1; // 90% availability
  }
}