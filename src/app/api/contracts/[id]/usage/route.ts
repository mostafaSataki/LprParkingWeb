import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for recording contract usage
const recordUsageSchema = z.object({
  plateNumber: z.string().min(1, 'پلاک خودرو الزامی است'),
  entranceTime: z.string().optional(),
  sessionId: z.string().optional(),
  notes: z.string().optional(),
});

// Validation schema for updating usage (exit)
const updateUsageSchema = z.object({
  exitTime: z.string().optional(),
  isValid: z.boolean().optional(),
  violationReason: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/contracts/[id]/usage - Record contract usage (entrance)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = recordUsageSchema.parse(body);

    // Check if contract exists and is active
    const contract = await db.parkingContract.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        location: true,
        vehicle: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'قرارداد پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    if (!contract.isActive) {
      return NextResponse.json(
        { success: false, error: 'قرارداد غیرفعال است' },
        { status: 400 }
      );
    }

    // Validate entrance time format
    let entranceDateTime = new Date();
    if (validatedData.entranceTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(validatedData.entranceTime)) {
        return NextResponse.json(
          { success: false, error: 'فرمت زمان ورود نامعتبر است (HH:mm:ss)' },
          { status: 400 }
        );
      }
      const [hours, minutes, seconds] = validatedData.entranceTime.split(':').map(Number);
      entranceDateTime.setHours(hours, minutes, seconds, 0);
    }

    // Check if vehicle matches contract (if vehicle is specified in contract)
    if (contract.vehicleId && contract.vehicleId !== validatedData.plateNumber) {
      return NextResponse.json(
        { success: false, error: 'خودرو با قرارداد مطابقت ندارد' },
        { status: 400 }
      );
    }

    // Validate contract rules for this entrance
    const validationResult = await validateContractEntrance(contract, entranceDateTime, validatedData.plateNumber);
    if (!validationResult.isValid) {
      // Record the usage but mark it as invalid
      const usage = await db.contractUsage.create({
        data: {
          contractId: params.id,
          sessionId: validatedData.sessionId,
          entranceDate: entranceDateTime,
          entranceTime: entranceDateTime.toTimeString().slice(0, 8),
          isValid: false,
          violationReason: validationResult.reason,
          notes: validatedData.notes,
        },
        include: {
          contract: {
            include: {
              customer: true,
              location: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: false,
        error: validationResult.reason,
        data: usage,
        isValid: false,
        violationReason: validationResult.reason,
      });
    }

    // Record valid usage
    const usage = await db.contractUsage.create({
      data: {
        contractId: params.id,
        sessionId: validatedData.sessionId,
        entranceDate: entranceDateTime,
        entranceTime: entranceDateTime.toTimeString().slice(0, 8),
        isValid: true,
        notes: validatedData.notes,
      },
      include: {
        contract: {
          include: {
            customer: true,
            location: true,
            vehicle: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: usage,
      message: 'ورود با موفقیت ثبت شد',
      isValid: true,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error recording contract usage:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت استفاده از قرارداد' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id]/usage - Update usage (exit)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateUsageSchema.parse(body);

    // Find the most recent active usage for this contract
    const usage = await db.contractUsage.findFirst({
      where: {
        contractId: params.id,
        exitDate: null, // Not yet exited
      },
      orderBy: {
        entranceDate: 'desc',
      },
    });

    if (!usage) {
      return NextResponse.json(
        { success: false, error: 'سوابق استفاده فعال یافت نشد' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    if (validatedData.exitTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(validatedData.exitTime)) {
        return NextResponse.json(
          { success: false, error: 'فرمت زمان خروج نامعتبر است (HH:mm:ss)' },
          { status: 400 }
        );
      }
      
      const exitDateTime = new Date(usage.entranceDate);
      const [hours, minutes, seconds] = validatedData.exitTime.split(':').map(Number);
      exitDateTime.setHours(hours, minutes, seconds, 0);
      
      updateData.exitDate = exitDateTime;
      updateData.exitTime = validatedData.exitTime;
    }

    // Update the usage record
    const updatedUsage = await db.contractUsage.update({
      where: { id: usage.id },
      data: updateData,
      include: {
        contract: {
          include: {
            customer: true,
            location: true,
            vehicle: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUsage,
      message: 'خروج با موفقیت ثبت شد',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating contract usage:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی استفاده از قرارداد' },
      { status: 500 }
    );
  }
}

// Helper function to validate contract entrance rules
async function validateContractEntrance(
  contract: any, 
  entranceDateTime: Date, 
  plateNumber: string
): Promise<{ isValid: boolean; reason?: string }> {
  
  // Check validity dates
  if (contract.validFrom && entranceDateTime < contract.validFrom) {
    return { isValid: false, reason: 'قرارداد هنوز شروع نشده است' };
  }

  if (contract.validTo && entranceDateTime > contract.validTo) {
    return { isValid: false, reason: 'قرارداد منقضی شده است' };
  }

  // Check day of week
  const dayOfWeek = entranceDateTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysAllowed = [
    contract.sundayAllowed,
    contract.mondayAllowed,
    contract.tuesdayAllowed,
    contract.wednesdayAllowed,
    contract.thursdayAllowed,
    contract.fridayAllowed,
    contract.saturdayAllowed
  ];

  if (!daysAllowed[dayOfWeek]) {
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    return { isValid: false, reason: `ورود در ${dayNames[dayOfWeek]} مجاز نیست` };
  }

  // Check time limits
  const timeString = entranceDateTime.toTimeString().slice(0, 5); // HH:mm format
  if (contract.startTime || contract.endTime) {
    const current = new Date(`2000-01-01 ${timeString}`);
    const start = contract.startTime ? new Date(`2000-01-01 ${contract.startTime}`) : new Date(`2000-01-01 00:00`);
    const end = contract.endTime ? new Date(`2000-01-01 ${contract.endTime}`) : new Date(`2000-01-01 23:59`);

    if (current < start || current > end) {
      return { isValid: false, reason: 'ورود در این ساعت مجاز نیست' };
    }
  }

  // Check entrance limits
  const limitCheck = await checkEntranceLimits(contract.id, entranceDateTime.toISOString());
  if (!limitCheck.canEnter) {
    return { isValid: false, reason: limitCheck.reason };
  }

  return { isValid: true };
}

// Helper function to check entrance limits
async function checkEntranceLimits(contractId: string, date: string): Promise<{
  canEnter: boolean;
  reason?: string;
}> {
  const contract = await db.parkingContract.findUnique({
    where: { id: contractId },
    include: {
      usages: {
        where: {
          entranceDate: {
            gte: new Date(date)
          },
          isValid: true // Only count valid usages
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
      reason: `محدودیت ورود روزانه (${contract.dailyEntranceLimit}) پر شده است`
    };
  }

  if (contract.weeklyEntranceLimit && weeklyUsages >= contract.weeklyEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود هفتگی (${contract.weeklyEntranceLimit}) پر شده است`
    };
  }

  if (contract.monthlyEntranceLimit && monthlyUsages >= contract.monthlyEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود ماهانه (${contract.monthlyEntranceLimit}) پر شده است`
    };
  }

  if (contract.totalEntranceLimit && totalUsages >= contract.totalEntranceLimit) {
    return {
      canEnter: false,
      reason: `محدودیت ورود کل (${contract.totalEntranceLimit}) پر شده است`
    };
  }

  return { canEnter: true };
}