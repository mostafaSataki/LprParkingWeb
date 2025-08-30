import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SMSReservationService } from '@/lib/sms-reservation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract SMS data from the request body
    // Format depends on SMS provider (e.g., Kavenegar, Ghasedak, etc.)
    const {
      from: phoneNumber,
      message: messageText,
      timestamp,
      ...otherData
    } = body;

    if (!phoneNumber || !messageText) {
      return NextResponse.json(
        { success: false, error: 'شماره تماس و متن پیام الزامی است' },
        { status: 400 }
      );
    }

    // Process the SMS message
    const response = await SMSReservationService.processSMS({
      phoneNumber: phoneNumber.replace(/^\+98/, '0'), // Normalize Iranian phone numbers
      messageText: messageText.trim(),
      receivedAt: timestamp ? new Date(timestamp) : new Date()
    });

    // Log the SMS interaction (optional) - only if reservation was created
    if (response.reservationId) {
      try {
        await prisma.reservationSMS.create({
          data: {
            reservationId: response.reservationId,
            phoneNumber,
            message: messageText,
            type: 'RESERVATION_CONFIRMATION',
            status: 'DELIVERED',
            sentAt: new Date()
          }
        });
      } catch (logError) {
        console.warn('Failed to log SMS interaction:', logError);
      }
    }

    // Send response SMS if SMS service is configured
    if (response.message) {
      try {
        await sendSMSResponse(phoneNumber, response.message);
      } catch (smsError) {
        console.error('Failed to send SMS response:', smsError);
        // Don't fail the request if SMS sending fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: true,
        response: response.message,
        reservationCode: response.reservationCode,
        reservationId: response.reservationId
      }
    });

  } catch (error) {
    console.error('SMS reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش پیام SMS' },
      { status: 500 }
    );
  }
}

/**
 * Send SMS response to user
 */
async function sendSMSResponse(phoneNumber: string, message: string): Promise<void> {
  // This would integrate with your SMS service provider
  // Example implementation for different providers:
  
  const smsProvider = process.env.SMS_PROVIDER; // 'kavenegar', 'ghasedak', etc.
  const apiKey = process.env.SMS_API_KEY;
  
  if (!apiKey) {
    console.warn('SMS API key not configured');
    return;
  }

  switch (smsProvider) {
    case 'kavenegar':
      await sendKavenegarSMS(apiKey, phoneNumber, message);
      break;
    case 'ghasedak':
      await sendGhasedakSMS(apiKey, phoneNumber, message);
      break;
    default:
      console.warn('Unknown SMS provider:', smsProvider);
      break;
  }
}

/**
 * Send SMS via Kavenegar
 */
async function sendKavenegarSMS(apiKey: string, phoneNumber: string, message: string): Promise<void> {
  const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      receptor: phoneNumber,
      message: message,
      sender: process.env.SMS_SENDER_NUMBER || '2000500666'
    }),
  });

  if (!response.ok) {
    throw new Error(`Kavenegar SMS failed: ${response.statusText}`);
  }
}

/**
 * Send SMS via Ghasedak
 */
async function sendGhasedakSMS(apiKey: string, phoneNumber: string, message: string): Promise<void> {
  const url = 'https://api.ghasedak.me/v2/sms/send/simple';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      message: message,
      receptor: phoneNumber,
      linenumber: process.env.SMS_SENDER_NUMBER || '30005088'
    }),
  });

  if (!response.ok) {
    throw new Error(`Ghasedak SMS failed: ${response.statusText}`);
  }
}

// Handle GET request for webhook verification (if required by SMS provider)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  // Some SMS providers require webhook verification
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    success: true,
    message: 'SMS webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}