import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a parking contract
const createContractSchema = z.object({
  customerId: z.string().min(1, 'مشتری الزامی است'),
  vehicleId: z.string().optional(),
  locationId: z.string().min(1, 'محل پارکینگ الزامی است'),
  name: z.string().min(1, 'نام قرارداد الزامی است'),
  description: z.string().optional(),
  contractType: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).default('MONTHLY'),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
  endDate: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  dailyEntranceLimit: z.number().min(1, 'محدودیت ورود روزانه باید بزرگتر از 0 باشد').default(1),
  weeklyEntranceLimit: z.number().min(1).optional(),
  monthlyEntranceLimit: z.number().min(1).optional(),
  totalEntranceLimit: z.number().min(1).optional(),
  mondayAllowed: z.boolean().default(true),
  tuesdayAllowed: z.boolean().default(true),
  wednesdayAllowed: z.boolean().default(true),
  thursdayAllowed: z.boolean().default(true),
  fridayAllowed: z.boolean().default(true),
  saturdayAllowed: z.boolean().default(true),
  sundayAllowed: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isActive: z.boolean().default(true),
  autoRenew: z.boolean().default(false),
  tariffId: z.string().optional(),
  fixedMonthlyFee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Validation schema for updating a parking contract
const updateContractSchema = createContractSchema.partial();

// Helper function to check time format
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Helper function to check if a time is within allowed hours
function isTimeWithinAllowedHours(currentTime: string, startTime?: string, endTime?: string): boolean {
  if (!startTime && !endTime) return true;
  
  const current = new Date(`2000-01-01 ${currentTime}`);
  const start = startTime ? new Date(`2000-01-01 ${startTime}`) : new Date(`2000-01-01 00:00`);
  const end = endTime ? new Date(`2000-01-01 ${endTime}`) : new Date(`2000-01-01 23:59`);
  
  return current >= start && current <= end;
}

// Helper function to check if today is allowed
function isDayAllowed(today: number, contract: any): boolean {
  const days = [
    contract.sundayAllowed,
    contract.mondayAllowed,
    contract.tuesdayAllowed,
    contract.wednesdayAllowed,
    contract.thursdayAllowed,
    contract.fridayAllowed,
    contract.saturdayAllowed
  ];
  return days[today];
}

// Helper function to check entrance limits
async function checkEntranceLimits(contractId: string, date: string): Promise<{
  canEnter: boolean;
  reason?: string;
  currentDaily?: number;
  currentWeekly?: number;
  currentMonthly?: number;
  currentTotal?: number;
}> {
  const contract = await db.parkingContract.findUnique({
    where: { id: contractId },
    include: {
      usages: {
        where: {
          entranceDate: {
            gte: new Date(date)
          }
        }
      }
    }
  });

  if (!contract) {
    return { canEnter: false, reason: 'قرارداد یافت نشد' };
  }

  const today = new Date(date);
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Count usages for different periods
  const dailyUsages = contract.usages.filter(usage => 
    usage.entranceDate >= startOfDay && usage.entranceDate <= endOfDay
  ).length;
  
  const weeklyUsages = contract.usages.filter(usage => 
    usage.entranceDate >= startOfWeek
  ).length;
  
  const monthlyUsages = contract.usages.filter(usage => 
    usage.entranceDate >= startOfMonth
  ).length;
  
  const totalUsages = contract.usages.length;

  // Check limits
  if (contract.dailyEntranceLimit && dailyUsages >= contract.dailyEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود روزانه (${contract.dailyEntranceLimit}) پر شده است`,
      currentDaily: dailyUsages
    };
  }

  if (contract.weeklyEntranceLimit && weeklyUsages >= contract.weeklyEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود هفتگی (${contract.weeklyEntranceLimit}) پر شده است`,
      currentWeekly: weeklyUsages
    };
  }

  if (contract.monthlyEntranceLimit && monthlyUsages >= contract.monthlyEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود ماهانه (${contract.monthlyEntranceLimit}) پر شده است`,
      currentMonthly: monthlyUsages
    };
  }

  if (contract.totalEntranceLimit && totalUsages >= contract.totalEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود کل (${contract.totalEntranceLimit}) پر شده است`,
      currentTotal: totalUsages
    };
  }

  return {
    canEnter: true,
    currentDaily: dailyUsages,
    currentWeekly: weeklyUsages,
    currentMonthly: monthlyUsages,
    currentTotal: totalUsages
  };
}

// GET /api/contracts - List parking contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const locationId = searchParams.get('locationId');
    const isActive = searchParams.get('isActive');
    const vehicleId = searchParams.get('vehicleId');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (locationId) where.locationId = locationId;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (vehicleId) where.vehicleId = vehicleId;

    const contracts = await db.parkingContract.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
            vehicleType: true,
            ownerName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        tariff: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            dailyRate: true,
          },
        },
        usages: {
          select: {
            id: true,
            entranceDate: true,
            entranceTime: true,
            isValid: true,
            violationReason: true,
          },
          orderBy: {
            entranceDate: 'desc',
          },
          take: 10, // Last 10 usages
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching parking contracts:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست قراردادهای پارکینگ' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create new parking contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createContractSchema.parse(body);

    // Validate time formats
    if (validatedData.startTime && !isValidTimeFormat(validatedData.startTime)) {
      return NextResponse.json(
        { success: false, error: 'فرمت زمان شروع نامعتبر است (HH:mm)' },
        { status: 400 }
      );
    }

    if (validatedData.endTime && !isValidTimeFormat(validatedData.endTime)) {
      return NextResponse.json(
        { success: false, error: 'فرمت زمان پایان نامعتبر است (HH:mm)' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await db.user.findUnique({
      where: { id: validatedData.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'مشتری یافت نشد' },
        { status: 404 }
      );
    }

    // Check if location exists
    const location = await db.parkingLocation.findUnique({
      where: { id: validatedData.locationId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'محل پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if vehicle exists if provided
    if (validatedData.vehicleId) {
      const vehicle = await db.vehicle.findUnique({
        where: { plateNumber: validatedData.vehicleId },
      });

      if (!vehicle) {
        return NextResponse.json(
          { success: false, error: 'خودرو یافت نشد' },
          { status: 404 }
        );
      }
    }

    // Check if tariff exists if provided
    if (validatedData.tariffId) {
      const tariff = await db.tariff.findUnique({
        where: { id: validatedData.tariffId },
      });

      if (!tariff) {
        return NextResponse.json(
          { success: false, error: 'تعرفه یافت نشد' },
          { status: 404 }
        );
      }
    }

    // Create the parking contract
    const contract = await db.parkingContract.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : new Date(),
        validTo: validatedData.validTo ? new Date(validatedData.validTo) : null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
            vehicleType: true,
            ownerName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        tariff: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            dailyRate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'قرارداد پارکینگ با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating parking contract:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد قرارداد پارکینگ' },
      { status: 500 }
    );
  }
}

// POST /api/contracts/validate - Validate contract for entrance
export async function validateEntrance(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, plateNumber, currentTime = new Date().toISOString() } = body;

    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'شناسه قرارداد الزامی است' },
        { status: 400 }
      );
    }

    const contract = await db.parkingContract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
        vehicle: true,
        location: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'قرارداد یافت نشد' },
        { status: 404 }
      );
    }

    // Check if contract is active
    if (!contract.isActive) {
      return NextResponse.json({
        success: false,
        error: 'قرارداد غیرفعال است',
        canEnter: false,
        reason: 'قرارداد غیرفعال است'
      });
    }

    // Check validity dates
    const now = new Date(currentTime);
    if (contract.validFrom && now < contract.validFrom) {
      return NextResponse.json({
        success: false,
        error: 'قرارداد هنوز شروع نشده است',
        canEnter: false,
        reason: 'قرارداد هنوز شروع نشده است'
      });
    }

    if (contract.validTo && now > contract.validTo) {
      return NextResponse.json({
        success: false,
        error: 'قرارداد منقضی شده است',
        canEnter: false,
        reason: 'قرارداد منقضی شده است'
      });
    }

    // Check if vehicle matches (if specified in contract)
    if (contract.vehicleId && contract.vehicleId !== plateNumber) {
      return NextResponse.json({
        success: false,
        error: 'خودرو با قرارداد مطابقت ندارد',
        canEnter: false,
        reason: 'خودرو با قرارداد مطابقت ندارد'
      });
    }

    // Check day of week
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (!isDayAllowed(dayOfWeek, contract)) {
      const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      return NextResponse.json({
        success: false,
        error: `ورود در ${dayNames[dayOfWeek]} مجاز نیست`,
        canEnter: false,
        reason: `ورود در ${dayNames[dayOfWeek]} مجاز نیست`
      });
    }

    // Check time limits
    const timeString = now.toTimeString().slice(0, 5); // HH:mm format
    if (!isTimeWithinAllowedHours(timeString, contract.startTime, contract.endTime)) {
      return NextResponse.json({
        success: false,
        error: 'ورود در این ساعت مجاز نیست',
        canEnter: false,
        reason: 'ورود در این ساعت مجاز نیست'
      });
    }

    // Check entrance limits
    const limitCheck = await checkEntranceLimits(contractId, currentTime);
    if (!limitCheck.canEnter) {
      return NextResponse.json({
        success: false,
        error: limitCheck.reason,
        canEnter: false,
        reason: limitCheck.reason,
        ...limitCheck
      });
    }

    return NextResponse.json({
      success: true,
      canEnter: true,
      message: 'ورود مجاز است',
      contract: {
        id: contract.id,
        name: contract.name,
        customerName: contract.customer.name,
        locationName: contract.location.name,
      },
      ...limitCheck
    });

  } catch (error) {
    console.error('Error validating contract entrance:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در اعتبارسنجی ورود', canEnter: false },
      { status: 500 }
    );
  }
}