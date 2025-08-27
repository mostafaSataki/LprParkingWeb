import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a parking contract
const updateContractSchema = z.object({
  customerId: z.string().min(1, 'مشتری الزامی است').optional(),
  vehicleId: z.string().optional(),
  locationId: z.string().min(1, 'محل پارکینگ الزامی است').optional(),
  name: z.string().min(1, 'نام قرارداد الزامی است').optional(),
  description: z.string().optional(),
  contractType: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است').optional(),
  endDate: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  dailyEntranceLimit: z.number().min(1, 'محدودیت ورود روزانه باید بزرگتر از 0 باشد').optional(),
  weeklyEntranceLimit: z.number().min(1).optional(),
  monthlyEntranceLimit: z.number().min(1).optional(),
  totalEntranceLimit: z.number().min(1).optional(),
  mondayAllowed: z.boolean().optional(),
  tuesdayAllowed: z.boolean().optional(),
  wednesdayAllowed: z.boolean().optional(),
  thursdayAllowed: z.boolean().optional(),
  fridayAllowed: z.boolean().optional(),
  saturdayAllowed: z.boolean().optional(),
  sundayAllowed: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isActive: z.boolean().optional(),
  autoRenew: z.boolean().optional(),
  tariffId: z.string().optional(),
  fixedMonthlyFee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Helper function to check time format
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// GET /api/contracts/[id] - Get single parking contract
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await db.parkingContract.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
            vehicleType: true,
            ownerName: true,
            ownerPhone: true,
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
            monthlyRate: true,
          },
        },
        usages: {
          orderBy: {
            entranceDate: 'desc',
          },
          take: 20, // Last 20 usages
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'قرارداد پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Calculate usage statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const monthlyUsages = contract.usages.filter(usage => 
      new Date(usage.entranceDate) >= startOfMonth
    ).length;

    const weeklyUsages = contract.usages.filter(usage => 
      new Date(usage.entranceDate) >= startOfWeek
    ).length;

    const dailyUsages = contract.usages.filter(usage => 
      new Date(usage.entranceDate) >= startOfDay
    ).length;

    const validUsages = contract.usages.filter(usage => usage.isValid).length;
    const invalidUsages = contract.usages.filter(usage => !usage.isValid).length;

    return NextResponse.json({
      success: true,
      data: {
        ...contract,
        statistics: {
          totalUsages: contract._count.usages,
          validUsages,
          invalidUsages,
          monthlyUsages,
          weeklyUsages,
          dailyUsages,
        }
      },
    });
  } catch (error) {
    console.error('Error fetching parking contract:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات قرارداد پارکینگ' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update parking contract
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateContractSchema.parse(body);

    // Check if contract exists
    const existingContract = await db.parkingContract.findUnique({
      where: { id: params.id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'قرارداد پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Validate time formats if provided
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

    // Check if customer exists if provided
    if (validatedData.customerId) {
      const customer = await db.user.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'مشتری یافت نشد' },
          { status: 404 }
        );
      }
    }

    // Check if location exists if provided
    if (validatedData.locationId) {
      const location = await db.parkingLocation.findUnique({
        where: { id: validatedData.locationId },
      });

      if (!location) {
        return NextResponse.json(
          { success: false, error: 'محل پارکینگ یافت نشد' },
          { status: 404 }
        );
      }
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

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Convert date strings to Date objects
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }
    if (validatedData.validFrom) {
      updateData.validFrom = new Date(validatedData.validFrom);
    }
    if (validatedData.validTo) {
      updateData.validTo = validatedData.validTo ? new Date(validatedData.validTo) : null;
    }

    // Update the parking contract
    const contract = await db.parkingContract.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'قرارداد پارکینگ با موفقیت به‌روزرسانی شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating parking contract:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی قرارداد پارکینگ' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete parking contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if contract exists
    const existingContract = await db.parkingContract.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'قرارداد پارکینگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if contract has usage records
    if (existingContract._count.usages > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'این قرارداد دارای سوابق استفاده است و قابل حذف نیست' 
        },
        { status: 400 }
      );
    }

    // Delete the parking contract
    await db.parkingContract.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'قرارداد پارکینگ با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting parking contract:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف قرارداد پارکینگ' },
      { status: 500 }
    );
  }
}