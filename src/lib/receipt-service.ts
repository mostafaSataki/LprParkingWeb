import { ReceiptConfig, RoundingRule, PaymentMethod } from '@prisma/client';

export interface ReceiptData {
  receiptNumber: string;
  complexName: string;
  address?: string;
  phone?: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: Date;
  exitTime?: Date;
  duration: number; // in minutes
  amount: number;
  paymentMethod: PaymentMethod;
  operatorName?: string;
  shiftName?: string;
  breakdown?: {
    entranceFee: number;
    hourlyRate: number;
    freeMinutes: number;
    paidMinutes: number;
    totalHours: number;
    discounts?: number;
  };
  footerText?: string;
  printedAt: Date;
}

export interface ReceiptOptions {
  showEntryTime: boolean;
  showExitTime: boolean;
  showAmount: boolean;
  showBreakdown: boolean;
  showOperator: boolean;
  showShift: boolean;
  roundingRule: RoundingRule;
  customFooter?: string;
  includeQRCode: boolean;
  includeBarcode: boolean;
  paperSize: 'THERMAL_80MM' | 'A4';
  language: 'FA' | 'EN';
}

export interface PrintedReceipt {
  id: string;
  receiptNumber: string;
  data: ReceiptData;
  options: ReceiptOptions;
  printedAt: Date;
  printerId?: string;
  status: 'PRINTED' | 'FAILED' | 'PENDING';
  error?: string;
}

export class ReceiptService {
  private static instance: ReceiptService;
  private config: ReceiptConfig;
  private receiptCounter = 0;

  private constructor() {
    this.initializeDefaultConfig();
  }

  static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  /**
   * Initialize default receipt configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      id: 'default',
      complexName: 'پارکینگ هوشمند',
      address: 'تهران، خیابان ولیعصر',
      phone: '021-12345678',
      footerText: 'با تشکر از اعتماد شما\nموفق باشید',
      showEntryTime: true,
      showExitTime: true,
      showAmount: true,
      roundingRule: RoundingRule.NEAREST_1000,
      isActive: true,
      updatedAt: new Date()
    };
  }

  /**
   * Generate receipt number
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    this.receiptCounter++;
    
    return `R${dateStr}${timeStr}${this.receiptCounter.toString().padStart(4, '0')}`;
  }

  /**
   * Round amount based on rule
   */
  roundAmount(amount: number, rule: RoundingRule): number {
    switch (rule) {
      case RoundingRule.NEAREST_1000:
        return Math.round(amount / 1000) * 1000;
      case RoundingRule.NEAREST_500:
        return Math.round(amount / 500) * 500;
      case RoundingRule.NEAREST_100:
        return Math.round(amount / 100) * 100;
      case RoundingRule.NO_ROUNDING:
      default:
        return amount;
    }
  }

  /**
   * Format amount with Persian numerals
   */
  formatAmount(amount: number, language: 'FA' | 'EN' = 'FA'): string {
    if (language === 'FA') {
      const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return amount.toLocaleString('fa-IR').replace(/[0-9]/g, (digit) => 
        persianNumerals[parseInt(digit)]
      );
    }
    return amount.toLocaleString();
  }

  /**
   * Format date with Persian calendar
   */
  formatDate(date: Date, language: 'FA' | 'EN' = 'FA'): string {
    if (language === 'FA') {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      return new Intl.DateTimeFormat('fa-IR', options).format(date);
    }
    return date.toLocaleString();
  }

  /**
   * Create receipt data
   */
  createReceiptData(
    plateNumber: string,
    vehicleType: string,
    entryTime: Date,
    exitTime?: Date,
    amount: number,
    paymentMethod: PaymentMethod,
    operatorName?: string,
    shiftName?: string,
    breakdown?: ReceiptData['breakdown']
  ): ReceiptData {
    const duration = exitTime ? 
      Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)) : 0;

    return {
      receiptNumber: this.generateReceiptNumber(),
      complexName: this.config.complexName,
      address: this.config.address,
      phone: this.config.phone,
      plateNumber,
      vehicleType,
      entryTime,
      exitTime,
      duration,
      amount,
      paymentMethod,
      operatorName,
      shiftName,
      breakdown,
      footerText: this.config.footerText,
      printedAt: new Date()
    };
  }

  /**
   * Generate receipt text for thermal printer
   */
  generateThermalReceipt(
    data: ReceiptData,
    options: ReceiptOptions
  ): string {
    const roundedAmount = this.roundAmount(data.amount, options.roundingRule);
    
    let receipt = '';
    
    // Header
    receipt += this.centerText(data.complexName) + '\n';
    if (data.address) {
      receipt += this.centerText(data.address) + '\n';
    }
    if (data.phone) {
      receipt += this.centerText(data.phone) + '\n';
    }
    receipt += '\n';
    
    // Receipt info
    receipt += this.centerText('رسید پارکینگ') + '\n';
    receipt += this.centerText('--------------------------') + '\n';
    receipt += `شماره رسید: ${data.receiptNumber}\n`;
    receipt += `تاریخ چاپ: ${this.formatDate(data.printedAt, options.language)}\n`;
    receipt += '--------------------------\n\n';
    
    // Vehicle info
    receipt += `پلاک خودرو: ${data.plateNumber}\n`;
    receipt += `نوع خودرو: ${data.vehicleType}\n`;
    
    // Time info
    if (options.showEntryTime) {
      receipt += `زمان ورود: ${this.formatDate(data.entryTime, options.language)}\n`;
    }
    if (options.showExitTime && data.exitTime) {
      receipt += `زمان خروج: ${this.formatDate(data.exitTime, options.language)}\n`;
    }
    receipt += `مدت توقف: ${this.formatDuration(data.duration)}\n`;
    
    // Operator and shift info
    if (options.showOperator && data.operatorName) {
      receipt += `اپراتور: ${data.operatorName}\n`;
    }
    if (options.showShift && data.shiftName) {
      receipt += `شیفت: ${data.shiftName}\n`;
    }
    
    receipt += '--------------------------\n';
    
    // Amount info
    if (options.showBreakdown && data.breakdown) {
      receipt += 'تفکیص هزینه:\n';
      receipt += `ورودیه: ${this.formatAmount(data.breakdown.entranceFee, options.language)} تومان\n`;
      receipt += `نرخ ساعتی: ${this.formatAmount(data.breakdown.hourlyRate, options.language)} تومان\n`;
      receipt += `دقایق رایگان: ${data.breakdown.freeMinutes} دقیقه\n`;
      receipt += `دقایق پرداختی: ${data.breakdown.paidMinutes} دقیقه\n`;
      receipt += `ساعت کل: ${data.breakdown.totalHours.toFixed(1)} ساعت\n`;
      if (data.breakdown.discounts) {
        receipt += `تخفیف: ${this.formatAmount(data.breakdown.discounts, options.language)} تومان\n`;
      }
      receipt += '--------------------------\n';
    }
    
    if (options.showAmount) {
      receipt += `مبلغ کل: ${this.formatAmount(roundedAmount, options.language)} تومان\n`;
    }
    receipt += `نوع پرداخت: ${this.getPaymentMethodLabel(data.paymentMethod)}\n`;
    
    // Footer
    receipt += '--------------------------\n';
    if (options.customFooter) {
      receipt += this.centerText(options.customFooter) + '\n';
    } else if (data.footerText) {
      receipt += this.centerText(data.footerText) + '\n';
    }
    
    // QR Code placeholder
    if (options.includeQRCode) {
      receipt += '\n';
      receipt += this.centerText('[QR Code]') + '\n';
    }
    
    receipt += '\n\n\n'; // Add space for cutting
    
    return receipt;
  }

  /**
   * Generate HTML receipt for web display
   */
  generateHTMLReceipt(
    data: ReceiptData,
    options: ReceiptOptions
  ): string {
    const roundedAmount = this.roundAmount(data.amount, options.roundingRule);
    
    return `
      <div class="receipt" dir="rtl">
        <div class="receipt-header text-center">
          <h2>${data.complexName}</h2>
          ${data.address ? `<p>${data.address}</p>` : ''}
          ${data.phone ? `<p>${data.phone}</p>` : ''}
        </div>
        
        <div class="receipt-info">
          <h3 class="text-center">رسید پارکینگ</h3>
          <div class="receipt-number">شماره رسید: ${data.receiptNumber}</div>
          <div class="print-date">تاریخ چاپ: ${this.formatDate(data.printedAt, options.language)}</div>
        </div>
        
        <div class="vehicle-info">
          <div class="plate-number">پلاک خودرو: ${data.plateNumber}</div>
          <div class="vehicle-type">نوع خودرو: ${data.vehicleType}</div>
        </div>
        
        <div class="time-info">
          ${options.showEntryTime ? `<div class="entry-time">زمان ورود: ${this.formatDate(data.entryTime, options.language)}</div>` : ''}
          ${options.showExitTime && data.exitTime ? `<div class="exit-time">زمان خروج: ${this.formatDate(data.exitTime, options.language)}</div>` : ''}
          <div class="duration">مدت توقف: ${this.formatDuration(data.duration)}</div>
        </div>
        
        ${(options.showOperator && data.operatorName) || (options.showShift && data.shiftName) ? `
          <div class="operator-info">
            ${options.showOperator && data.operatorName ? `<div class="operator">اپراتور: ${data.operatorName}</div>` : ''}
            ${options.showShift && data.shiftName ? `<div class="shift">شیفت: ${data.shiftName}</div>` : ''}
          </div>
        ` : ''}
        
        ${options.showBreakdown && data.breakdown ? `
          <div class="breakdown">
            <h4>تفکیص هزینه:</h4>
            <div class="breakdown-item">
              <span>ورودیه:</span>
              <span>${this.formatAmount(data.breakdown.entranceFee, options.language)} تومان</span>
            </div>
            <div class="breakdown-item">
              <span>نرخ ساعتی:</span>
              <span>${this.formatAmount(data.breakdown.hourlyRate, options.language)} تومان</span>
            </div>
            <div class="breakdown-item">
              <span>دقایق رایگان:</span>
              <span>${data.breakdown.freeMinutes} دقیقه</span>
            </div>
            <div class="breakdown-item">
              <span>دقایق پرداختی:</span>
              <span>${data.breakdown.paidMinutes} دقیقه</span>
            </div>
            <div class="breakdown-item">
              <span>ساعت کل:</span>
              <span>${data.breakdown.totalHours.toFixed(1)} ساعت</span>
            </div>
            ${data.breakdown.discounts ? `
              <div class="breakdown-item discount">
                <span>تخفیف:</span>
                <span>${this.formatAmount(data.breakdown.discounts, options.language)} تومان</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="amount-info">
          ${options.showAmount ? `
            <div class="total-amount">
              <span>مبلغ کل:</span>
              <span>${this.formatAmount(roundedAmount, options.language)} تومان</span>
            </div>
          ` : ''}
          <div class="payment-method">
            <span>نوع پرداخت:</span>
            <span>${this.getPaymentMethodLabel(data.paymentMethod)}</span>
          </div>
        </div>
        
        <div class="receipt-footer text-center">
          ${options.customFooter || data.footerText || ''}
        </div>
        
        ${options.includeQRCode ? '<div class="qr-code text-center">[QR Code]</div>' : ''}
      </div>
    `;
  }

  /**
   * Print receipt to thermal printer
   */
  async printThermalReceipt(
    data: ReceiptData,
    options: ReceiptOptions,
    printerId?: string
  ): Promise<PrintedReceipt> {
    const receiptId = `print_${Date.now()}`;
    const receiptText = this.generateThermalReceipt(data, options);
    
    try {
      // Mock printing - in real app, this would interface with printer API
      console.log('Printing receipt:', receiptText);
      
      const printedReceipt: PrintedReceipt = {
        id: receiptId,
        receiptNumber: data.receiptNumber,
        data,
        options,
        printedAt: new Date(),
        printerId,
        status: 'PRINTED'
      };
      
      return printedReceipt;
    } catch (error) {
      return {
        id: receiptId,
        receiptNumber: data.receiptNumber,
        data,
        options,
        printedAt: new Date(),
        printerId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'خطا در چاپ رسید'
      };
    }
  }

  /**
   * Get receipt configuration
   */
  getConfig(): ReceiptConfig {
    return { ...this.config };
  }

  /**
   * Update receipt configuration
   */
  updateConfig(updates: Partial<ReceiptConfig>): void {
    this.config = { ...this.config, ...updates, updatedAt: new Date() };
  }

  /**
   * Get payment method label
   */
  private getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
      [PaymentMethod.CASH]: 'نقدی',
      [PaymentMethod.CARD]: 'کارت',
      [PaymentMethod.POS]: 'کارتخوان',
      [PaymentMethod.ONLINE]: 'آنلاین',
      [PaymentMethod.CREDIT]: 'اعتباری'
    };
    return labels[method];
  }

  /**
   * Format duration
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ساعت و ${remainingMinutes} دقیقه`;
    }
    return `${remainingMinutes} دقیقه`;
  }

  /**
   * Center text for thermal printer
   */
  private centerText(text: string): string {
    const maxWidth = 32; // Thermal printer width
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }
}