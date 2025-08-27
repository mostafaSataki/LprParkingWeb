import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const accessLevel = searchParams.get('accessLevel') || 'all';
    const isActive = searchParams.get('isActive') || 'all';
    const organization = searchParams.get('organization') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { nationalCode: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { vehicles: { some: { plateNumber: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (accessLevel !== 'all') {
      where.accessLevel = accessLevel;
    }

    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (organization) {
      where.organization = { contains: organization, mode: 'insensitive' };
    }

    const [persons, total] = await Promise.all([
      db.person.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicles: {
            where: { isActive: true },
            orderBy: { isPrimary: 'desc' }
          },
          sessions: {
            select: {
              id: true,
              entryTime: true,
              exitTime: true,
              status: true
            },
            orderBy: { entryTime: 'desc' },
            take: 5
          }
        }
      }),
      db.person.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      persons,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات اشخاص' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      nationalCode,
      mobile,
      email,
      organization,
      department,
      position,
      vehicles,
      accessLevel,
      notes
    } = body;

    // Check if national code already exists
    if (nationalCode) {
      const existingPerson = await db.person.findUnique({
        where: { nationalCode }
      });

      if (existingPerson) {
        return NextResponse.json(
          { error: 'کد ملی قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    const person = await db.person.create({
      data: {
        firstName,
        lastName,
        nationalCode,
        mobile,
        email,
        organization,
        department,
        position,
        accessLevel: accessLevel || 'STANDARD',
        notes
      },
      include: {
        vehicles: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        },
        sessions: {
          select: {
            id: true,
            entryTime: true,
            exitTime: true,
            status: true
          },
          orderBy: { entryTime: 'desc' },
          take: 5
        }
      }
    });

    // Add vehicles if provided
    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        await db.personVehicle.create({
          data: {
            personId: person.id,
            plateNumber: vehicle.plateNumber,
            vehicleType: vehicle.vehicleType || 'CAR',
            vehicleName: vehicle.vehicleName,
            isPrimary: vehicle.isPrimary || false,
            notes: vehicle.notes
          }
        });
      }
    }

    // Fetch the updated person with vehicles
    const updatedPerson = await db.person.findUnique({
      where: { id: person.id },
      include: {
        vehicles: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        },
        sessions: {
          select: {
            id: true,
            entryTime: true,
            exitTime: true,
            status: true
          },
          orderBy: { entryTime: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json(updatedPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد شخص' },
      { status: 500 }
    );
  }
}