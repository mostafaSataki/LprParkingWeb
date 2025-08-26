import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Customer info
      name,
      email,
      phone,
      nationalId,
      address,
      
      // Credit account info
      initialBalance = 0,
      monthlyLimit = 0,
      creditLimit = 0,
      warningThreshold = 10000,
      autoCharge = true,
      monthlyChargeAmount = 100000,
      chargeDayOfMonth = 1,
      
      // Vehicle info
      plateNumbers = [],
      vehicleTypes = [],
      
      // Notification preferences
      enableEmailNotifications = true,
      enableSMSNotifications = false,
      enableInAppNotifications = true
    } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'نام، ایمیل و شماره تلفن الزامی هستند' },
        { status: 400 }
      );
    }

    if (plateNumbers.length === 0 || !plateNumbers[0]) {
      return NextResponse.json(
        { error: 'حداقل یک پلاک خودرو الزامی است' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email }
        ]
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'مشتری با این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Generate default password
    const defaultPassword = phone;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Use transaction to create customer and credit account
    const result = await db.$transaction(async (tx) => {
      // Create customer
      const customer = await tx.user.create({
        data: {
          name,
          email,
          username: email,
          password: hashedPassword,
          role: 'OPERATOR',
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      // Create credit account
      const creditAccount = await tx.creditAccount.create({
        data: {
          userId: customer.id,
          balance: initialBalance,
          monthlyLimit,
          creditLimit,
          warningThreshold,
          isActive: true,
          autoCharge,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create credit account settings
      await tx.creditAccountSettings.create({
        data: {
          accountId: creditAccount.id,
          autoMonthlyCharge: autoCharge,
          monthlyChargeAmount,
          chargeDayOfMonth,
          lowBalanceThreshold: warningThreshold,
          warningThreshold1: warningThreshold * 5,
          warningThreshold2: warningThreshold * 2,
          criticalThreshold: warningThreshold,
          enableEmailNotifications,
          enableSMSNotifications,
          enableInAppNotifications,
          suspendOnZeroBalance: true,
        },
      });

      // Create vehicles for each plate number
      for (let i = 0; i < plateNumbers.length; i++) {
        const plateNumber = plateNumbers[i].trim();
        const vehicleType = vehicleTypes[i] || 'CAR';
        
        if (plateNumber) {
          await tx.vehicle.create({
            data: {
              plateNumber,
              vehicleType,
              ownerName: name,
              ownerPhone: phone,
              isAllowed: true,
              isBlacklisted: false,
            },
          });
        }
      }

      // Create initial transaction if balance > 0
      if (initialBalance > 0) {
        await tx.creditTransaction.create({
          data: {
            accountId: creditAccount.id,
            amount: initialBalance,
            type: 'CHARGE',
            description: 'شارژ اولیه حساب',
            balanceBefore: 0,
            balanceAfter: initialBalance,
          },
        });
      }

      return { customer, creditAccount };
    });

    return NextResponse.json({
      message: 'مشتری و حساب اعتباری با موفقیت ایجاد شدند',
      customer: result.customer,
      account: {
        id: result.creditAccount.id,
        userId: result.creditAccount.userId,
        userName: result.creditAccount.user.name,
        userEmail: result.creditAccount.user.email,
        balance: result.creditAccount.balance,
        monthlyLimit: result.creditAccount.monthlyLimit,
        creditLimit: result.creditAccount.creditLimit,
        warningThreshold: result.creditAccount.warningThreshold,
        isActive: result.creditAccount.isActive,
        autoCharge: result.creditAccount.autoCharge,
        createdAt: result.creditAccount.createdAt,
        updatedAt: result.creditAccount.updatedAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating customer and credit account:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد مشتری و حساب اعتباری' },
      { status: 500 }
    );
  }
}