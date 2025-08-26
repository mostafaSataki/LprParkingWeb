import { CreditAccount, CreditTransaction, CreditTransactionType } from '@prisma/client';

export interface CreditAccountWithTransactions extends CreditAccount {
  transactions: CreditTransaction[];
}

export interface CreditWarning {
  type: 'LOW_BALANCE' | 'MONTHLY_LIMIT' | 'CREDIT_LIMIT';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface CreditChargeResult {
  success: boolean;
  newBalance: number;
  transaction?: CreditTransaction;
  error?: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  transaction?: CreditTransaction;
  error?: string;
  warnings?: CreditWarning[];
}

export class CreditSystemService {
  /**
   * Create a new credit account for a user
   */
  static async createCreditAccount(
    userId: string,
    initialBalance: number = 0,
    monthlyLimit: number = 0,
    creditLimit: number = 0,
    warningThreshold: number = 10000
  ): Promise<CreditAccount> {
    // This would typically interact with the database
    // For now, we'll return a mock object
    const account: CreditAccount = {
      id: `credit_${Date.now()}`,
      userId,
      balance: initialBalance,
      monthlyLimit,
      creditLimit,
      warningThreshold,
      isActive: true,
      lastChargedAt: null,
      nextChargeDate: null,
      autoCharge: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return account;
  }

  /**
   * Get credit account by user ID
   */
  static async getCreditAccount(userId: string): Promise<CreditAccountWithTransactions | null> {
    // Mock implementation - in real app, this would query the database
    const mockAccount: CreditAccountWithTransactions = {
      id: 'credit_1',
      userId,
      balance: 50000,
      monthlyLimit: 200000,
      creditLimit: 100000,
      warningThreshold: 10000,
      isActive: true,
      lastChargedAt: new Date('2024-01-01'),
      nextChargeDate: new Date('2024-02-01'),
      autoCharge: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      transactions: [
        {
          id: 'tx_1',
          accountId: 'credit_1',
          amount: 100000,
          type: CreditTransactionType.CHARGE,
          description: 'شارژ ماهانه',
          referenceId: 'charge_1',
          balanceBefore: 0,
          balanceAfter: 100000,
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'tx_2',
          accountId: 'credit_1',
          amount: -15000,
          type: CreditTransactionType.DEDUCTION,
          description: 'پارکینگ خودرو',
          referenceId: 'session_1',
          balanceBefore: 100000,
          balanceAfter: 85000,
          createdAt: new Date('2024-01-02')
        },
        {
          id: 'tx_3',
          accountId: 'credit_1',
          amount: -20000,
          type: CreditTransactionType.DEDUCTION,
          description: 'پارکینگ خودرو',
          referenceId: 'session_2',
          balanceBefore: 85000,
          balanceAfter: 65000,
          createdAt: new Date('2024-01-03')
        }
      ]
    };

    return mockAccount;
  }

  /**
   * Charge credit to account
   */
  static async chargeCredit(
    accountId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<CreditChargeResult> {
    try {
      const account = await this.getCreditAccountByAccountId(accountId);
      if (!account) {
        return {
          success: false,
          newBalance: 0,
          error: 'حساب اعتباری یافت نشد'
        };
      }

      if (!account.isActive) {
        return {
          success: false,
          newBalance: account.balance,
          error: 'حساب اعتباری غیرفعال است'
        };
      }

      const newBalance = account.balance + amount;
      const transaction: CreditTransaction = {
        id: `tx_${Date.now()}`,
        accountId,
        amount,
        type: CreditTransactionType.CHARGE,
        description: description || 'شارژ حساب',
        referenceId,
        balanceBefore: account.balance,
        balanceAfter: newBalance,
        createdAt: new Date()
      };

      // In a real app, this would be a database transaction
      // For now, we'll just return the result
      return {
        success: true,
        newBalance,
        transaction
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        error: 'خطا در شارژ حساب'
      };
    }
  }

  /**
   * Deduct credit from account
   */
  static async deductCredit(
    accountId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<CreditDeductionResult> {
    try {
      const account = await this.getCreditAccountByAccountId(accountId);
      if (!account) {
        return {
          success: false,
          newBalance: 0,
          error: 'حساب اعتباری یافت نشد'
        };
      }

      if (!account.isActive) {
        return {
          success: false,
          newBalance: account.balance,
          error: 'حساب اعتباری غیرفعال است'
        };
      }

      const warnings: CreditWarning[] = [];

      // Check if deduction would exceed credit limit
      if (account.balance - amount < -account.creditLimit) {
        return {
          success: false,
          newBalance: account.balance,
          error: 'موجودی حساب کافی نیست'
        };
      }

      // Check for low balance warning
      if (account.balance - amount <= account.warningThreshold) {
        warnings.push({
          type: 'LOW_BALANCE',
          message: `موجودی حساب شما کم است: ${account.balance - amount} تومان`,
          severity: 'warning'
        });
      }

      // Check monthly limit
      const currentMonthSpending = await this.getCurrentMonthSpending(accountId);
      if (currentMonthSpending + amount > account.monthlyLimit) {
        warnings.push({
          type: 'MONTHLY_LIMIT',
          message: `شما در حال نزدیک شدن به سقف ماهانه هستید: ${currentMonthSpending + amount} / ${account.monthlyLimit} تومان`,
          severity: 'warning'
        });
      }

      const newBalance = account.balance - amount;
      const transaction: CreditTransaction = {
        id: `tx_${Date.now()}`,
        accountId,
        amount: -amount,
        type: CreditTransactionType.DEDUCTION,
        description: description || 'کسر از حساب',
        referenceId,
        balanceBefore: account.balance,
        balanceAfter: newBalance,
        createdAt: new Date()
      };

      return {
        success: true,
        newBalance,
        transaction,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        error: 'خطا در کسر از حساب'
      };
    }
  }

  /**
   * Process monthly credit charge
   */
  static async processMonthlyCharges(): Promise<void> {
    // This would typically be called by a scheduled job
    const accounts = await this.getAllActiveAccounts();
    
    for (const account of accounts) {
      if (account.autoCharge && account.monthlyLimit > 0) {
        await this.chargeCredit(
          account.id,
          account.monthlyLimit,
          'شارژ ماهانه خودکار',
          `monthly_${Date.now()}`
        );
      }
    }
  }

  /**
   * Get account warnings
   */
  static async getAccountWarnings(accountId: string): Promise<CreditWarning[]> {
    const account = await this.getCreditAccountByAccountId(accountId);
    if (!account) return [];

    const warnings: CreditWarning[] = [];

    // Low balance warning
    if (account.balance <= account.warningThreshold) {
      warnings.push({
        type: 'LOW_BALANCE',
        message: `موجودی حساب شما کم است: ${account.balance} تومان`,
        severity: 'warning'
      });
    }

    // Credit limit warning
    if (account.balance < 0) {
      warnings.push({
        type: 'CREDIT_LIMIT',
        message: `شما از اعتبار خود استفاده کرده‌اید: ${Math.abs(account.balance)} تومان`,
        severity: 'error'
      });
    }

    // Monthly limit warning
    const currentMonthSpending = await this.getCurrentMonthSpending(accountId);
    if (currentMonthSpending >= account.monthlyLimit * 0.8) {
      warnings.push({
        type: 'MONTHLY_LIMIT',
        message: `شما در حال نزدیک شدن به سقف ماهانه هستید: ${currentMonthSpending} / ${account.monthlyLimit} تومان`,
        severity: 'warning'
      });
    }

    return warnings;
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    // Mock implementation
    const transactions: CreditTransaction[] = [];
    for (let i = 0; i < limit; i++) {
      transactions.push({
        id: `tx_${i + 1}`,
        accountId,
        amount: Math.random() > 0.5 ? 10000 : -5000,
        type: Math.random() > 0.5 ? CreditTransactionType.CHARGE : CreditTransactionType.DEDUCTION,
        description: 'تراکنش تست',
        referenceId: `ref_${i + 1}`,
        balanceBefore: Math.random() * 100000,
        balanceAfter: Math.random() * 100000,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    return transactions.slice(offset, offset + limit);
  }

  /**
   * Get account statement for a period
   */
  static async getAccountStatement(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    openingBalance: number;
    closingBalance: number;
    totalCharges: number;
    totalDeductions: number;
    transactions: CreditTransaction[];
  }> {
    const transactions = await this.getTransactionHistory(accountId, 1000);
    const filteredTransactions = transactions.filter(
      t => t.createdAt >= startDate && t.createdAt <= endDate
    );

    const openingBalance = 0; // Calculate from transactions before start date
    const totalCharges = filteredTransactions
      .filter(t => t.type === CreditTransactionType.CHARGE)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDeductions = Math.abs(
      filteredTransactions
        .filter(t => t.type === CreditTransactionType.DEDUCTION)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const closingBalance = openingBalance + totalCharges - totalDeductions;

    return {
      openingBalance,
      closingBalance,
      totalCharges,
      totalDeductions,
      transactions: filteredTransactions
    };
  }

  // Helper methods (would be implemented with actual database queries)
  private static async getCreditAccountByAccountId(accountId: string): Promise<CreditAccount | null> {
    // Mock implementation
    return {
      id: accountId,
      userId: 'user_1',
      balance: 50000,
      monthlyLimit: 200000,
      creditLimit: 100000,
      warningThreshold: 10000,
      isActive: true,
      lastChargedAt: new Date('2024-01-01'),
      nextChargeDate: new Date('2024-02-01'),
      autoCharge: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };
  }

  private static async getAllActiveAccounts(): Promise<CreditAccount[]> {
    // Mock implementation
    return [];
  }

  private static async getCurrentMonthSpending(accountId: string): Promise<number> {
    // Mock implementation
    return 50000;
  }
}