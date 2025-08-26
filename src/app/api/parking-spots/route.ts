import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a parking spot
const createParkingSpotSchema = z.object({
  lotId: z.string().min(1, 'پارکینگ الزامی است'),
  spotNumber: z.string().min(1, 'شماره جای پارک الزامی است'),
  section: z.string().optional(),
  floorNumber: z.number().min(0).optional(),
  type: z.enum(['STANDARD', 'WIDE', 'DISABLED', 'ELECTRIC', 'RESERVED', 'VIP']).optional(),
  width: z.number().positive().optional(),
  length: z.number().positive().optional(),
  notes: z.string().optional(),
});

// GET /api/parking-spots - List parking spots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get('lotId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const floorNumber = searchParams.get('floorNumber');
    const section = searchParams.get('section');

    const where: any = {};
    
    if (lotId) where.lotId = lotId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (floorNumber) where.floorNumber = parseInt(floorNumber);
    if (section) where.section = section;

    const parkingSpots = await db.parkingSpot.findMany({
      where,
      include: {
        lot: {
          select: { id: true, name: true, floorNumber: true, section: true },
        },
        reservations: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          },
          select: { id: true, startTime: true, endTime: true },
        },
      },
      orderBy: [
        { floorNumber: 'asc' },
        { section: 'asc' },
        { spotNumber: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: parkingSpots,
    });
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست جای‌های پارک' },
      { status: 500 }
    );
  }
}

// POST /api/parking-spots - Create new parking spot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createParkingSpotSchema.parse(body);

    // Check if the lot exists
    const lot = await db.parkingLot.findUnique({
      where: { id: validatedData.lotId },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'پارکینگ مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if spot number already exists in this lot
    const existingSpot = await db.parkingSpot.findUnique({
      where: {
        lotId_spotNumber: {
          lotId: validatedData.lotId,
          spotNumber: validatedData.spotNumber,
        },
      },
    });

    if (existingSpot) {
      return NextResponse.json(
        { success: false, error: 'جای پارک با این شماره در این پارکینگ وجود دارد' },
        { status: 400 }
      );
    }

    // Create the parking spot
    const parkingSpot = await db.parkingSpot.create({
      data: {
        lotId: validatedData.lotId,
        spotNumber: validatedData.spotNumber,
        section: validatedData.section,
        floorNumber: validatedData.floorNumber,
        type: validatedData.type,
        width: validatedData.width,
        length: validatedData.length,
        notes: validatedData.notes,
      },
      include: {
        lot: {
          select: { id: true, name: true, floorNumber: true, section: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: parkingSpot,
      message: 'جای پارک با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating parking spot:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد جای پارک' },
      { status: 500 }
    );
  }
}