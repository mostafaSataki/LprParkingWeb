import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doorId = searchParams.get('doorId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    
    let whereClause: any = {};
    
    if (doorId) {
      whereClause.doorId = doorId;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          door: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    const cameras = await db.camera.findMany({
      where: whereClause,
      include: {
        location: true,
        door: {
          include: {
            locations: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست دوربین‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      direction,
      ipAddress,
      rtspUrl,
      resolution,
      locationId,
      doorId,
      notes
    } = body;

    if (!name || !locationId || !doorId) {
      return NextResponse.json(
        { error: 'نام، مکان پارکینگ و درب الزامی هستند' },
        { status: 400 }
      );
    }

    const camera = await db.camera.create({
      data: {
        name,
        type,
        direction,
        ipAddress,
        rtspUrl,
        resolution,
        locationId,
        doorId,
        notes
      },
      include: {
        location: true,
        door: {
          include: {
            locations: {
              include: {
                location: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(camera, { status: 201 });
  } catch (error) {
    console.error('Error creating camera:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد دوربین' },
      { status: 500 }
    );
  }
}