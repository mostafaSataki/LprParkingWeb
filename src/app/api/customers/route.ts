import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {
      role: 'OPERATOR' // Customers are operators in this system
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              credits: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات مشتریان' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, nationalId, address } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'نام، ایمیل و شماره تلفن الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email } // Use email as username for customers
        ]
      }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'مشتری با این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Generate a default password (customer's phone number)
    const defaultPassword = phone;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const customer = await db.user.create({
      data: {
        name,
        email,
        username: email, // Use email as username
        password: hashedPassword,
        role: 'OPERATOR', // Customers are operators in this system
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

    return NextResponse.json({
      customer,
      message: 'مشتری با موفقیت ایجاد شد'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد مشتری جدید' },
      { status: 500 }
    );
  }
}