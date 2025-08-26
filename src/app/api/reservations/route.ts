import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a reservation
const createReservationSchema = z.object({
  customerName: z.string().min(1, 'نام مشتری الزامی است'),
  customerPhone: z.string().min(1, 'شماره تلفن الزامی است'),
  customerEmail: z.string().email().optional().nullable(),
  vehiclePlate: z.string().optional().nullable(),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'VAN']).optional(),
  spotId: z.string().optional().nullable(),
  lotId: z.string().min(1, 'پارکینگ الزامی است'),
  locationId: z.string().min(1, 'مکان پارکینگ الزامی است'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().min(1, 'مدت زمان رزرو باید بیشتر از ۰ باشد'),
  notes: z.string().optional().nullable(),
});

// Generate unique reservation code
function generateReservationCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `PRK-${timestamp}-${random}`.toUpperCase();
}

// Calculate reservation amount based on duration and tariff
async function calculateReservationAmount(lotId: string, duration: number): Promise<number> {
  // Get the lot and its location to find applicable tariff
  const lot = await db.parkingLot.findUnique({
    where: { id: lotId },
    include: {
      location: true,
    },
  });

  if (!lot) {
    throw new Error('پارکینگ مورد نظر یافت نشد');
  }

  // For now, use a simple calculation (can be enhanced with complex tariff logic)
  const hourlyRate = 10000; // Default 10,000 per hour
  const hours = duration / 60;
  return Math.round(hours * hourlyRate);
}

// GET /api/reservations - List reservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const lotId = searchParams.get('lotId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (lotId) where.lotId = lotId;
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [reservations, total] = await Promise.all([
      db.reservation.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          spot: true,
          lot: true,
          location: true,
          payments: {
            select: { id: true, amount: true, status: true, paymentMethod: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.reservation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست رزروها' },
      { status: 500 }
    );
  }
}

// POST /api/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReservationSchema.parse(body);

    // Check if the lot exists and has capacity
    const lot = await db.parkingLot.findUnique({
      where: { id: validatedData.lotId, isActive: true },
      include: {
        location: true,
        parkingSpots: {
          where: { 
            status: 'AVAILABLE',
            isReserved: false,
            isDisabled: false,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'پارکینگ مورد نظر یافت نشد یا غیرفعال است' },
        { status: 404 }
      );
    }

    // Check if there are available spots
    if (validatedData.spotId) {
      const spot = await db.parkingSpot.findUnique({
        where: { id: validatedData.spotId },
      });
      
      if (!spot || spot.status !== 'AVAILABLE') {
        return NextResponse.json(
          { success: false, error: 'جای پارک مورد نظر در دسترس نیست' },
          { status: 400 }
        );
      }
    } else if (lot.parkingSpots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ظرفیت پارکینگ تکمیل شده است' },
        { status: 400 }
      );
    }

    // Check for overlapping reservations
    const overlappingReservation = await db.reservation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(validatedData.startTime) } },
              { endTime: { gte: new Date(validatedData.startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lte: new Date(validatedData.endTime) } },
              { endTime: { gte: new Date(validatedData.endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(validatedData.startTime) } },
              { endTime: { lte: new Date(validatedData.endTime) } },
            ],
          },
        ],
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        ...(validatedData.spotId && { spotId: validatedData.spotId }),
      },
    });

    if (overlappingReservation) {
      return NextResponse.json(
        { success: false, error: 'این جای پارک در زمان مورد نظر رزرو شده است' },
        { status: 400 }
      );
    }

    // Calculate reservation amount
    const totalAmount = await calculateReservationAmount(validatedData.lotId, validatedData.duration);

    // Generate reservation code
    const reservationCode = generateReservationCode();

    // Create the reservation
    const reservation = await db.reservation.create({
      data: {
        reservationCode,
        customerId: validatedData.customerEmail ? undefined : undefined, // Would need to find/create user
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        customerEmail: validatedData.customerEmail,
        vehiclePlate: validatedData.vehiclePlate,
        vehicleType: validatedData.vehicleType,
        spotId: validatedData.spotId,
        lotId: validatedData.lotId,
        locationId: validatedData.locationId,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        duration: validatedData.duration,
        totalAmount,
        notes: validatedData.notes,
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        spot: true,
        lot: true,
        location: true,
      },
    });

    // If a specific spot was reserved, update its status
    if (validatedData.spotId) {
      await db.parkingSpot.update({
        where: { id: validatedData.spotId },
        data: { status: 'RESERVED', isReserved: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: reservation,
      message: 'رزرو با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد رزرو' },
      { status: 500 }
    );
  }
}