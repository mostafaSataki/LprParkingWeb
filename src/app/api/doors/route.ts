import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          locations: {
            some: {
              location: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    const doors = await db.door.findMany({
      where: whereClause,
      include: {
        locations: {
          include: {
            location: true
          }
        },
        cameras: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the response to match expected format
    const transformedDoors = doors.map(door => ({
      ...door,
      locations: door.locations.map(dl => dl.location)
    }));

    return NextResponse.json(transformedDoors);
  } catch (error) {
    console.error('Error fetching doors:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست درب‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      locationIds,
      notes
    } = body;

    if (!name || !locationIds || locationIds.length === 0) {
      return NextResponse.json(
        { error: 'نام و حداقل یک پارکینگ الزامی هستند' },
        { status: 400 }
      );
    }

    // Create door with locations
    const door = await db.door.create({
      data: {
        name,
        description,
        type,
        notes,
        locations: {
          create: locationIds.map((locationId: string) => ({
            locationId
          }))
        }
      },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    });

    // Transform the response
    const transformedDoor = {
      ...door,
      locations: door.locations.map(dl => dl.location)
    };

    return NextResponse.json(transformedDoor, { status: 201 });
  } catch (error) {
    console.error('Error creating door:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد درب' },
      { status: 500 }
    );
  }
}