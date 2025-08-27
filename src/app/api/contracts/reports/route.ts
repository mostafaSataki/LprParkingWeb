import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for contract reports
const reportSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  contractType: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  isActive: z.boolean().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'contract']).default('day'),
});

// GET /api/contracts/reports - Generate contract reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = reportSchema.parse(Object.fromEntries(searchParams));

    // Build date filters
    const dateFilter: any = {};
    if (validatedParams.startDate) {
      dateFilter.gte = new Date(validatedParams.startDate);
    }
    if (validatedParams.endDate) {
      dateFilter.lte = new Date(validatedParams.endDate);
    }

    // Build contract filters
    const contractFilter: any = {};
    if (validatedParams.locationId) contractFilter.locationId = validatedParams.locationId;
    if (validatedParams.customerId) contractFilter.customerId = validatedParams.customerId;
    if (validatedParams.contractType) contractFilter.contractType = validatedParams.contractType;
    if (validatedParams.isActive !== undefined) contractFilter.isActive = validatedParams.isActive;

    // Get contracts with filters
    const contracts = await db.parkingContract.findMany({
      where: contractFilter,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicle: {
          select: {
            plateNumber: true,
            vehicleType: true,
          },
        },
        usages: {
          where: {
            entranceDate: dateFilter,
          },
          select: {
            id: true,
            entranceDate: true,
            entranceTime: true,
            exitDate: true,
            exitTime: true,
            isValid: true,
            violationReason: true,
          },
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

    // Generate report based on groupBy parameter
    let reportData: any;

    switch (validatedParams.groupBy) {
      case 'day':
        reportData = await generateDailyReport(contracts, validatedParams);
        break;
      case 'week':
        reportData = await generateWeeklyReport(contracts, validatedParams);
        break;
      case 'month':
        reportData = await generateMonthlyReport(contracts, validatedParams);
        break;
      case 'contract':
        reportData = await generateContractReport(contracts, validatedParams);
        break;
      default:
        reportData = await generateDailyReport(contracts, validatedParams);
    }

    // Calculate summary statistics
    const summary = calculateSummaryStatistics(contracts);

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        summary,
        filters: validatedParams,
        totalContracts: contracts.length,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error generating contract report:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در生成 گزارش قراردادها' },
      { status: 500 }
    );
  }
}

// Generate daily report
async function generateDailyReport(contracts: any[], params: any) {
  const dailyData: { [key: string]: any } = {};

  contracts.forEach(contract => {
    contract.usages.forEach((usage: any) => {
      const dateKey = usage.entranceDate.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          totalUsages: 0,
          validUsages: 0,
          invalidUsages: 0,
          totalContracts: 0,
          activeContracts: 0,
          contracts: [],
        };
      }

      dailyData[dateKey].totalUsages++;
      if (usage.isValid) {
        dailyData[dateKey].validUsages++;
      } else {
        dailyData[dateKey].invalidUsages++;
      }
    });

    // Count contracts for this day
    const dateKey = new Date().toISOString().split('T')[0]; // Today
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        totalUsages: 0,
        validUsages: 0,
        invalidUsages: 0,
        totalContracts: 0,
        activeContracts: 0,
        contracts: [],
      };
    }

    dailyData[dateKey].totalContracts++;
    if (contract.isActive) {
      dailyData[dateKey].activeContracts++;
    }
  });

  return Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

// Generate weekly report
async function generateWeeklyReport(contracts: any[], params: any) {
  const weeklyData: { [key: string]: any } = {};

  contracts.forEach(contract => {
    contract.usages.forEach((usage: any) => {
      const date = new Date(usage.entranceDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalUsages: 0,
          validUsages: 0,
          invalidUsages: 0,
          totalContracts: 0,
          activeContracts: 0,
          contracts: [],
        };
      }

      weeklyData[weekKey].totalUsages++;
      if (usage.isValid) {
        weeklyData[weekKey].validUsages++;
      } else {
        weeklyData[weekKey].invalidUsages++;
      }
    });

    // Count contracts for current week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: weekKey,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalUsages: 0,
        validUsages: 0,
        invalidUsages: 0,
        totalContracts: 0,
        activeContracts: 0,
        contracts: [],
      };
    }

    weeklyData[weekKey].totalContracts++;
    if (contract.isActive) {
      weeklyData[weekKey].activeContracts++;
    }
  });

  return Object.values(weeklyData).sort((a: any, b: any) => a.weekStart.localeCompare(b.weekStart));
}

// Generate monthly report
async function generateMonthlyReport(contracts: any[], params: any) {
  const monthlyData: { [key: string]: any } = {};

  contracts.forEach(contract => {
    contract.usages.forEach((usage: any) => {
      const date = new Date(usage.entranceDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalUsages: 0,
          validUsages: 0,
          invalidUsages: 0,
          totalContracts: 0,
          activeContracts: 0,
          contracts: [],
        };
      }

      monthlyData[monthKey].totalUsages++;
      if (usage.isValid) {
        monthlyData[monthKey].validUsages++;
      } else {
        monthlyData[monthKey].invalidUsages++;
      }
    });

    // Count contracts for current month
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        totalUsages: 0,
        validUsages: 0,
        invalidUsages: 0,
        totalContracts: 0,
        activeContracts: 0,
        contracts: [],
      };
    }

    monthlyData[monthKey].totalContracts++;
    if (contract.isActive) {
      monthlyData[monthKey].activeContracts++;
    }
  });

  return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
}

// Generate contract-based report
async function generateContractReport(contracts: any[], params: any) {
  return contracts.map(contract => {
    const validUsages = contract.usages.filter((u: any) => u.isValid).length;
    const invalidUsages = contract.usages.filter((u: any) => !u.isValid).length;
    
    // Calculate average usage per day/week/month
    const contractDuration = contract.endDate 
      ? (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24)
      : (new Date().getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24);
    
    const avgDailyUsage = contractDuration > 0 ? validUsages / contractDuration : 0;

    return {
      contract: {
        id: contract.id,
        name: contract.name,
        contractType: contract.contractType,
        customerName: contract.customer.name,
        locationName: contract.location.name,
        vehiclePlate: contract.vehicle?.plateNumber,
        isActive: contract.isActive,
        startDate: contract.startDate,
        endDate: contract.endDate,
      },
      usage: {
        totalUsages: contract.usages.length,
        validUsages,
        invalidUsages,
        avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        utilizationRate: contract.dailyEntranceLimit 
          ? Math.min(100, Math.round((avgDailyUsage / contract.dailyEntranceLimit) * 100))
          : 0,
      },
      limits: {
        dailyEntranceLimit: contract.dailyEntranceLimit,
        weeklyEntranceLimit: contract.weeklyEntranceLimit,
        monthlyEntranceLimit: contract.monthlyEntranceLimit,
        totalEntranceLimit: contract.totalEntranceLimit,
      },
      timeRestrictions: {
        startTime: contract.startTime,
        endTime: contract.endTime,
        mondayAllowed: contract.mondayAllowed,
        tuesdayAllowed: contract.tuesdayAllowed,
        wednesdayAllowed: contract.wednesdayAllowed,
        thursdayAllowed: contract.thursdayAllowed,
        fridayAllowed: contract.fridayAllowed,
        saturdayAllowed: contract.saturdayAllowed,
        sundayAllowed: contract.sundayAllowed,
      },
    };
  });
}

// Calculate summary statistics
function calculateSummaryStatistics(contracts: any[]) {
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.isActive).length;
  const expiredContracts = contracts.filter(c => c.endDate && new Date(c.endDate) < new Date()).length;
  
  let totalUsages = 0;
  let validUsages = 0;
  let invalidUsages = 0;
  
  contracts.forEach(contract => {
    contract.usages.forEach((usage: any) => {
      totalUsages++;
      if (usage.isValid) {
        validUsages++;
      } else {
        invalidUsages++;
      }
    });
  });

  const contractsByType = contracts.reduce((acc: any, contract) => {
    acc[contract.contractType] = (acc[contract.contractType] || 0) + 1;
    return acc;
  }, {});

  const contractsByLocation = contracts.reduce((acc: any, contract) => {
    const locationName = contract.location.name;
    acc[locationName] = (acc[locationName] || 0) + 1;
    return acc;
  }, {});

  const violationsByReason = contracts.reduce((acc: any, contract) => {
    contract.usages.forEach((usage: any) => {
      if (!usage.isValid && usage.violationReason) {
        acc[usage.violationReason] = (acc[usage.violationReason] || 0) + 1;
      }
    });
    return acc;
  }, {});

  return {
    totalContracts,
    activeContracts,
    expiredContracts,
    totalUsages,
    validUsages,
    invalidUsages,
    violationRate: totalUsages > 0 ? Math.round((invalidUsages / totalUsages) * 100) : 0,
    contractsByType,
    contractsByLocation,
    violationsByReason,
  };
}