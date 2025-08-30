import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VehicleAlertService } from '@/lib/vehicle-alerts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recognitionId,
      sessionId,
      plateNumber,
      cameraId,
      eventType, // 'ENTRY' | 'EXIT'
      timestamp,
      confidence,
      image
    } = body;

    if (!plateNumber || !cameraId) {
      return NextResponse.json(
        { success: false, error: 'شماره پلاک و شناسه دوربین الزامی است' },
        { status: 400 }
      );
    }

    // Create or get plate recognition record
    let recognition;
    
    if (recognitionId) {
      recognition = await prisma.plateRecognition.findUnique({
        where: { id: recognitionId }
      });
    }

    if (!recognition) {
      recognition = await prisma.plateRecognition.create({
        data: {
          sessionId,
          cameraId,
          plateNumber,
          confidence: confidence || 0.95,
          croppedImage: image?.cropped,
          fullImage: image?.full,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          processed: false
        }
      });
    }

    // Get parking session if available
    let session = null;
    if (sessionId) {
      session = await prisma.parkingSession.findUnique({
        where: { id: sessionId }
      });
    }

    // Process vehicle alerts
    const triggeredAlerts = await VehicleAlertService.processVehicleRecognition(
      recognition,
      session || undefined,
      eventType || 'ENTRY'
    );

    // Mark recognition as processed
    await prisma.plateRecognition.update({
      where: { id: recognition.id },
      data: { processed: true }
    });

    // Log the event for audit trail
    const alertIds = triggeredAlerts.map(alert => alert.alertId);
    
    return NextResponse.json({
      success: true,
      data: {
        recognitionId: recognition.id,
        plateNumber,
        eventType: eventType || 'ENTRY',
        triggeredAlerts: triggeredAlerts.length,
        alertIds,
        notifications: triggeredAlerts.map(alert => ({
          id: alert.id,
          message: alert.message,
          recipients: alert.recipients.length,
          status: alert.status
        })),
        timestamp: recognition.timestamp
      }
    });

  } catch (error) {
    console.error('Vehicle alert processing error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش هشدار خودرو' },
      { status: 500 }
    );
  }
}

// GET endpoint to test alert processing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plateNumber = searchParams.get('plateNumber');
    const eventType = searchParams.get('eventType') || 'ENTRY';

    if (!plateNumber) {
      return NextResponse.json(
        { success: false, error: 'شماره پلاک الزامی است' },
        { status: 400 }
      );
    }

    // Create a mock recognition for testing
    const mockRecognition = {
      id: `test_${Date.now()}`,
      sessionId: null,
      cameraId: 'camera_1',
      plateNumber,
      confidence: 0.95,
      croppedImage: null,
      fullImage: null,
      timestamp: new Date(),
      processed: false,
      createdAt: new Date()
    };

    // Process alerts
    const triggeredAlerts = await VehicleAlertService.processVehicleRecognition(
      mockRecognition,
      undefined,
      eventType as 'ENTRY' | 'EXIT'
    );

    return NextResponse.json({
      success: true,
      data: {
        plateNumber,
        eventType,
        triggeredAlerts: triggeredAlerts.length,
        alerts: triggeredAlerts.map(alert => ({
          alertId: alert.alertId,
          message: alert.message,
          recipients: alert.recipients.map(r => ({
            userId: r.userId,
            userRole: r.userRole,
            notificationMethod: r.notificationMethod,
            status: r.status
          }))
        })),
        testMode: true
      }
    });

  } catch (error) {
    console.error('Vehicle alert test error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تست هشدار خودرو' },
      { status: 500 }
    );
  }
}