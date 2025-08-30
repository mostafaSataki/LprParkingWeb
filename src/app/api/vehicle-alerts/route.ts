import { NextRequest, NextResponse } from 'next/server';
import { VehicleAlertService, AlertType, AlertLevel, TriggerEvent } from '@/lib/vehicle-alerts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active'; // active, history, all
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let result;

    switch (type) {
      case 'active':
        result = VehicleAlertService.getActiveAlerts();
        break;
      case 'history':
        result = VehicleAlertService.getAlertHistory(limit, offset);
        break;
      case 'all':
        result = {
          activeAlerts: VehicleAlertService.getActiveAlerts(),
          recentNotifications: VehicleAlertService.getAlertHistory(10, 0)
        };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'نوع درخواست نامعتبر است' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Vehicle alerts GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت هشدارها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plateNumber,
      vehicleType,
      alertType,
      alertLevel,
      triggerEvent,
      message,
      description,
      notifyOnEntry,
      notifyOnExit,
      notifyManagers,
      notifySecurity,
      managersToNotify,
      securityToNotify,
      customMessage,
      createdBy,
      isActive = true
    } = body;

    // Validation
    if (!plateNumber || !alertType || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'پلاک خودرو، نوع هشدار و ایجادکننده الزامی است' },
        { status: 400 }
      );
    }

    if (!Object.values(AlertType).includes(alertType)) {
      return NextResponse.json(
        { success: false, error: 'نوع هشدار نامعتبر است' },
        { status: 400 }
      );
    }

    const alert = await VehicleAlertService.createVehicleAlert({
      vehicleId: `vehicle_${plateNumber}`,
      plateNumber,
      vehicleType: vehicleType || 'CAR',
      alertType,
      alertLevel: alertLevel || AlertLevel.MEDIUM,
      triggerEvent: triggerEvent || TriggerEvent.BOTH,
      message: message || `هشدار برای خودرو ${plateNumber}`,
      description,
      isActive,
      notifyOnEntry: notifyOnEntry !== false,
      notifyOnExit: notifyOnExit !== false,
      notifyManagers: notifyManagers !== false,
      notifySecurity: notifySecurity === true,
      managersToNotify: managersToNotify || [],
      securityToNotify: securityToNotify || [],
      customMessage,
      createdBy
    });

    return NextResponse.json({
      success: true,
      data: {
        alert,
        message: 'هشدار با موفقیت ایجاد شد'
      }
    });

  } catch (error) {
    console.error('Vehicle alerts POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد هشدار' },
      { status: 500 }
    );
  }
}