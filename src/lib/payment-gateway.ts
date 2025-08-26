// Payment Gateway Integration Service
export interface PaymentGatewayConfig {
  merchantId: string;
  terminalId: string;
  apiKey: string;
  callbackUrl: string;
  sandbox: boolean;
}

export interface PaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  mobile?: string;
  email?: string;
  callbackUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  authority?: string;
  paymentUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentVerificationRequest {
  authority: string;
  amount: number;
}

export interface PaymentVerificationResponse {
  success: boolean;
  refId?: string;
  cardNumber?: string;
  errorCode?: string;
  errorMessage?: string;
}

class PaymentGateway {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  // Generate payment URL
  async requestPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      // In a real implementation, this would call the actual payment gateway API
      // For demo purposes, we'll simulate the response
      
      if (this.config.sandbox) {
        // Simulate sandbox response
        const authority = `A${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const paymentUrl = `https://sandbox.zarinpal.com/pg/StartPay/${authority}`;
        
        return {
          success: true,
          authority,
          paymentUrl,
        };
      }

      // Real implementation would go here
      // const response = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     merchant_id: this.config.merchantId,
      //     amount: paymentData.amount,
      //     description: paymentData.description,
      //     mobile: paymentData.mobile,
      //     email: paymentData.email,
      //     callback_url: paymentData.callbackUrl,
      //   }),
      // });
      
      // const result = await response.json();
      
      // if (result.data.code === 100) {
      //   return {
      //     success: true,
      //     authority: result.data.authority,
      //     paymentUrl: `https://www.zarinpal.com/pg/StartPay/${result.data.authority}`,
      //   };
      // } else {
      //   return {
      //     success: false,
      //     errorCode: result.data.code.toString(),
      //     errorMessage: result.errors.message || 'Unknown error',
      //   };
      // }

      return {
        success: false,
        errorCode: 'NOT_IMPLEMENTED',
        errorMessage: 'Real payment gateway not implemented',
      };
    } catch (error) {
      console.error('Payment request error:', error);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'خطا در ارتباط با درگاه پرداخت',
      };
    }
  }

  // Verify payment
  async verifyPayment(verificationData: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      if (this.config.sandbox) {
        // Simulate sandbox verification
        return {
          success: true,
          refId: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          cardNumber: '6037********1234',
        };
      }

      // Real implementation would go here
      // const response = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     merchant_id: this.config.merchantId,
      //     authority: verificationData.authority,
      //     amount: verificationData.amount,
      //   }),
      // });
      
      // const result = await response.json();
      
      // if (result.data.code === 100) {
      //   return {
      //     success: true,
      //     refId: result.data.ref_id,
      //     cardNumber: result.data.card_pan,
      //   };
      // } else {
      //   return {
      //     success: false,
      //     errorCode: result.data.code.toString(),
      //     errorMessage: result.errors.message || 'Payment verification failed',
      //   };
      // }

      return {
        success: false,
        errorCode: 'NOT_IMPLEMENTED',
        errorMessage: 'Real payment gateway not implemented',
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'خطا در تأیید پرداخت',
      };
    }
  }
}

// Create payment gateway instance
export const createPaymentGateway = (config: PaymentGatewayConfig) => {
  return new PaymentGateway(config);
};

// Default configuration (should be moved to environment variables)
export const defaultPaymentConfig: PaymentGatewayConfig = {
  merchantId: process.env.PAYMENT_MERCHANT_ID || 'test-merchant',
  terminalId: process.env.PAYMENT_TERMINAL_ID || 'test-terminal',
  apiKey: process.env.PAYMENT_API_KEY || 'test-api-key',
  callbackUrl: process.env.PAYMENT_CALLBACK_URL || 'http://localhost:3000/api/payment/callback',
  sandbox: process.env.NODE_ENV !== 'production',
};

// Export singleton instance
export const paymentGateway = createPaymentGateway(defaultPaymentConfig);