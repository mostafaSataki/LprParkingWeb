import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Clear existing data (optional)
    await db.personVehicle.deleteMany();
    await db.person.deleteMany();

    // Sample persons data
    const samplePersons = [
      {
        firstName: "علی",
        lastName: "رضایی",
        nationalCode: "1234567890",
        mobile: "09123456789",
        email: "ali.rezaei@example.com",
        organization: "شرکت فناوری اطلاعات",
        department: "توسعه نرم‌افزار",
        position: "برنامه‌نویس ارشد",
        accessLevel: "STANDARD",
        notes: "کارمند نمونه سال 1402"
      },
      {
        firstName: "سارا",
        lastName: "محمدی",
        nationalCode: "2345678901",
        mobile: "09234567890",
        email: "sara.mohammadi@example.com",
        organization: "بانک ملی",
        department: "فناوری اطلاعات",
        position: "مدیر IT",
        accessLevel: "VIP",
        notes: "مدیر بخش فناوری اطلاعات"
      },
      {
        firstName: "رضا",
        lastName: "حسینی",
        nationalCode: "3456789012",
        mobile: "09345678901",
        email: "reza.hosseini@example.com",
        organization: "سازمان مالیاتی",
        department: "حسابداری",
        position: "کارشناس مالی",
        accessLevel: "STAFF",
        notes: "کارشناس ارشد مالی"
      },
      {
        firstName: "مریم",
        lastName: "اکبری",
        nationalCode: "4567890123",
        mobile: "09456789012",
        email: "maryam.akbari@example.com",
        organization: "شرکت خودروسازی",
        department: "منابع انسانی",
        position: "مدیر منابع انسانی",
        accessLevel: "MANAGEMENT",
        notes: "مدیر منابع انسانی"
      },
      {
        firstName: "محمد",
        lastName: "صالحی",
        nationalCode: "5678901234",
        mobile: "09567890123",
        email: "mohammad.salehi@example.com",
        organization: "دانشگاه تهران",
        department: "تحصیلات تکمیلی",
        position: "استاد دانشکده",
        accessLevel: "STANDARD",
        notes: "عضو هیئت علمی"
      },
      {
        firstName: "زهرا",
        lastName: "کریمی",
        nationalCode: "6789012345",
        mobile: "09678901234",
        email: "zahra.karimi@example.com",
        organization: "بیمارستان امام خمینی",
        department: "پرستاری",
        position: "سرپرستار",
        accessLevel: "STAFF",
        notes: "سرپرستار اورژانس"
      },
      {
        firstName: "حسین",
        lastName: "احمدی",
        nationalCode: "7890123456",
        mobile: "09789012345",
        email: "hossein.ahmadi@example.com",
        organization: "شرکت نفت",
        department: "مهندسی",
        position: "مهندس نفت",
        accessLevel: "STANDARD",
        notes: "مهندس ارشد نفت"
      },
      {
        firstName: "فاطمه",
        lastName: "صادقی",
        nationalCode: "8901234567",
        mobile: "09890123456",
        email: "fatemeh.sadeghi@example.com",
        organization: "شرکت مخابرات",
        department: "فروش",
        position: "مدیر فروش",
        accessLevel: "VIP",
        notes: "مدیر فروش منطقه"
      },
      {
        firstName: "امیر",
        lastName: "نوری",
        nationalCode: "9012345678",
        mobile: "09112345678",
        email: "amir.nouri@example.com",
        organization: "شرکت دارویی",
        department: "تحقیق و توسعه",
        position: "محقق دارو",
        accessLevel: "STANDARD",
        notes: "محقق ارشد دارو"
      },
      {
        firstName: "لیلا",
        lastName: "اسلامی",
        nationalCode: "0123456789",
        mobile: "09223456789",
        email: "leila.eslami@example.com",
        organization: "شرکت پست",
        department: "لجستیک",
        position: "مدیر لجستیک",
        accessLevel: "MANAGEMENT",
        notes: "مدیر لجستیک و حمل و نقل"
      },
      {
        firstName: "بهروز",
        lastName: "قاسمی",
        nationalCode: "1122334455",
        mobile: "09333445566",
        email: "behroogh.ghasemi@example.com",
        organization: "شرکت فولاد",
        department: "تولید",
        position: "مدیر تولید",
        accessLevel: "STAFF",
        notes: "مدیر کارخانه فولاد"
      },
      {
        firstName: "سمیرا",
        lastName: "محمدپور",
        nationalCode: "2233445566",
        mobile: "09444556677",
        email: "samira.mohammadpour@example.com",
        organization: "شرکت نساجی",
        department: "طراحی",
        position: "طراح لباس",
        accessLevel: "STANDARD",
        notes: "طراح ارشد لباس"
      },
      {
        firstName: "کامران",
        lastName: "هدایت",
        nationalCode: "3344556677",
        mobile: "09555667788",
        email: "kamyar.hedayat@example.com",
        organization: "شرکت ساختمانی",
        department: "مهندسی عمران",
        position: "مهندس عمران",
        accessLevel: "STANDARD",
        notes: "مهندس ناظر پروژه"
      },
      {
        firstName: "نسیم",
        lastName: "رشیدی",
        nationalCode: "4455667788",
        mobile: "09666778899",
        email: "nasim.rashidi@example.com",
        organization: "شرکت بیمه",
        department: "بیمه عمر",
        position: "کارشناس بیمه",
        accessLevel: "VIP",
        notes: "کارشناس ارشد بیمه عمر"
      },
      {
        firstName: "فرید",
        lastName: "موسوی",
        nationalCode: "5566778899",
        mobile: "09777889900",
        email: "farid.mousavi@example.com",
        organization: "شرکت حمل و نقل",
        department: "ناوگان",
        position: "مدیر ناوگان",
        accessLevel: "STAFF",
        notes: "مدیر ناوگان حمل و نقل"
      }
    ];

    // Sample vehicles data
    const sampleVehicles = [
      { plateNumber: "۱۲۳۴۵۶۷۸", vehicleType: "CAR", vehicleName: "پراید", isPrimary: true },
      { plateNumber: "۸۷۶۵۴۳۲۱", vehicleType: "CAR", vehicleName: "پژو 206", isPrimary: true },
      { plateNumber: "۱۱۱۲۲۳۳", vehicleType: "CAR", vehicleName: "تیبا", isPrimary: true },
      { plateNumber: "۴۴۴۵۵۵۶", vehicleType: "CAR", vehicleName: "سامند", isPrimary: true },
      { plateNumber: "۷۷۷۸۸۸۹", vehicleType: "MOTORCYCLE", vehicleName: "هوندا", isPrimary: true },
      { plateNumber: "۲۲۲۳۳۳۴", vehicleType: "CAR", vehicleName: "رنو", isPrimary: true },
      { plateNumber: "۵۵۵۶۶۶۷", vehicleType: "TRUCK", vehicleName: "کامیون", isPrimary: true },
      { plateNumber: "۸۸۸۹۹۹۰", vehicleType: "CAR", vehicleName: "سانتافه", isPrimary: true },
      { plateNumber: "۳۳۳۴۴۴۵", vehicleType: "CAR", vehicleName: "سیویک", isPrimary: true },
      { plateNumber: "۶۶۶۷۷۷۸", vehicleType: "VAN", vehicleName: "وانت", isPrimary: true },
      { plateNumber: "۹۹۹۰۰۰۱", vehicleType: "CAR", vehicleName: "ال نینتی", isPrimary: true },
      { plateNumber: "۱۲۱۳۱۴۱", vehicleType: "CAR", vehicleName: "مازراتی", isPrimary: true },
      { plateNumber: "۵۱۶۲۷۳۸", vehicleType: "CAR", vehicleName: "بی ام و", isPrimary: true },
      { plateNumber: "۹۲۹۳۹۴۹", vehicleType: "CAR", vehicleName: "مرسدس", isPrimary: true },
      { plateNumber: "۷۳۷۴۷۵۷", vehicleType: "BUS", vehicleName: "اتوبوس", isPrimary: true }
    ];

    // Create persons and their vehicles
    const createdPersons = [];
    for (let i = 0; i < samplePersons.length; i++) {
      const personData = samplePersons[i];
      
      const person = await db.person.create({
        data: personData
      });
      
      // Add vehicle to each person
      if (i < sampleVehicles.length) {
        const vehicleData = sampleVehicles[i];
        await db.personVehicle.create({
          data: {
            personId: person.id,
            plateNumber: vehicleData.plateNumber,
            vehicleType: vehicleData.vehicleType,
            vehicleName: vehicleData.vehicleName,
            isPrimary: vehicleData.isPrimary
          }
        });
      }
      
      createdPersons.push(person);
    }

    return NextResponse.json({ 
      message: `Successfully created ${createdPersons.length} sample persons with vehicles`,
      count: createdPersons.length 
    });

  } catch (error) {
    console.error('Error seeding sample data:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد داده‌های نمونه' },
      { status: 500 }
    );
  }
}