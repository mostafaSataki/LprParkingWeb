import { Vehicle, ParkingSession, User, PlateRecognition } from '@prisma/client';

export interface VehicleAlert {
  id: string;
  vehicleId: string;
  alertType: AlertType;
  alertLevel: AlertLevel;
  plateNumber: string;
  vehicleType: string;
  triggerEvent: TriggerEvent;
  message: string;
  description?: string;
  isActive: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  notifyManagers: boolean;
  notifySecurity: boolean;
  managersToNotify: string[]; // User IDs
  securityToNotify: string[]; // User IDs
  customMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  sessionId?: string;
  recognitionId?: string;
  plateNumber: string;
  eventType: 'ENTRY' | 'EXIT';
  locationId: string;
  cameraId?: string;
  triggeredAt: Date;
  message: string;
  recipients: NotificationRecipient[];
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  error?: string;
}

export interface NotificationRecipient {
  userId: string;
  userRole: string;
  phone?: string;
  email?: string;
  notificationMethod: 'SMS' | 'EMAIL' | 'BOTH';
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  error?: string;
}

export enum AlertType {
  BLACKLIST = 'BLACKLIST',
  VIP = 'VIP',
  SECURITY_WATCH = 'SECURITY_WATCH',
  FREQUENT_VISITOR = 'FREQUENT_VISITOR',
  STAFF_VEHICLE = 'STAFF_VEHICLE',
  EMERGENCY_VEHICLE = 'EMERGENCY_VEHICLE',
  CUSTOM = 'CUSTOM'
}

export enum AlertLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TriggerEvent {
  ENTRY_ONLY = 'ENTRY_ONLY',
  EXIT_ONLY = 'EXIT_ONLY',
  BOTH = 'BOTH'
}

export interface AlertRule {
  alertType: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
}

export interface AlertAction {
  type: 'SMS' | 'EMAIL' | 'SOUND_ALARM' | 'LOG' | 'BLOCK_ENTRY';
  recipients: string[];
  message: string;
  priority: number;
}

export class VehicleAlertService {
  private static alerts: Map<string, VehicleAlert> = new Map();
  private static notifications: AlertNotification[] = [];

  /**
   * Create a new vehicle alert
   */
  static async createVehicleAlert(alertData: Omit<VehicleAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<VehicleAlert> {
    const alert: VehicleAlert = {
      id: `alert_${Date.now()}`,
      ...alertData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.alerts.set(alert.plateNumber, alert);
    return alert;
  }

  /**
   * Process vehicle recognition and trigger alerts if needed
   */
  static async processVehicleRecognition(
    recognition: PlateRecognition,
    session?: ParkingSession,
    eventType: 'ENTRY' | 'EXIT' = 'ENTRY'
  ): Promise<AlertNotification[]> {
    const plateNumber = recognition.plateNumber;
    const triggeredAlerts: AlertNotification[] = [];

    // Check for active alerts for this vehicle
    const vehicleAlerts = await this.getActiveAlertsForVehicle(plateNumber);

    for (const alert of vehicleAlerts) {
      // Check if this event should trigger the alert
      if (!this.shouldTriggerAlert(alert, eventType)) {
        continue;
      }

      // Create notification
      const notification = await this.createAlertNotification(
        alert,
        recognition,
        session,
        eventType
      );

      triggeredAlerts.push(notification);

      // Send notifications to specified recipients
      await this.sendNotifications(notification);
    }

    return triggeredAlerts;
  }

  /**
   * Create alert notification
   */
  private static async createAlertNotification(
    alert: VehicleAlert,
    recognition: PlateRecognition,
    session?: ParkingSession,
    eventType: 'ENTRY' | 'EXIT' = 'ENTRY'
  ): Promise<AlertNotification> {
    const message = this.generateAlertMessage(alert, eventType, recognition.timestamp);

    // Get recipients
    const recipients: NotificationRecipient[] = [];

    // Add managers
    if (alert.notifyManagers) {
      for (const managerId of alert.managersToNotify) {
        const manager = await this.getUserById(managerId);
        if (manager) {
          recipients.push({
            userId: manager.id,
            userRole: manager.role,
            phone: this.getUserPhone(manager),
            email: manager.email,
            notificationMethod: 'BOTH',
            status: 'PENDING'
          });
        }
      }
    }

    // Add security personnel
    if (alert.notifySecurity) {
      for (const securityId of alert.securityToNotify) {
        const security = await this.getUserById(securityId);
        if (security) {
          recipients.push({
            userId: security.id,
            userRole: security.role,
            phone: this.getUserPhone(security),
            email: security.email,
            notificationMethod: 'BOTH',
            status: 'PENDING'
          });
        }
      }
    }

    const notification: AlertNotification = {
      id: `notification_${Date.now()}`,
      alertId: alert.id,
      sessionId: session?.id,
      recognitionId: recognition.id,
      plateNumber: recognition.plateNumber,
      eventType,
      locationId: recognition.cameraId, // Assuming camera belongs to a location
      cameraId: recognition.cameraId,
      triggeredAt: recognition.timestamp,
      message,
      recipients,
      status: 'PENDING'
    };

    this.notifications.push(notification);
    return notification;
  }

  /**
   * Send notifications to all recipients
   */
  private static async sendNotifications(notification: AlertNotification): Promise<void> {
    for (const recipient of notification.recipients) {
      try {
        await this.sendNotificationToRecipient(notification, recipient);
        recipient.status = 'SENT';
        recipient.sentAt = new Date();
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.userId}:`, error);
        recipient.status = 'FAILED';
        recipient.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Update overall notification status
    const allSent = notification.recipients.every(r => r.status === 'SENT');
    const anyFailed = notification.recipients.some(r => r.status === 'FAILED');

    if (allSent) {
      notification.status = 'SENT';
      notification.sentAt = new Date();
    } else if (anyFailed) {
      notification.status = 'FAILED';
    }
  }

  /**
   * Send notification to a specific recipient
   */
  private static async sendNotificationToRecipient(
    notification: AlertNotification,
    recipient: NotificationRecipient
  ): Promise<void> {
    const { notificationMethod, phone, email } = recipient;

    if (notificationMethod === 'SMS' || notificationMethod === 'BOTH') {
      if (phone) {
        await this.sendSMS(phone, notification.message);
      }
    }

    if (notificationMethod === 'EMAIL' || notificationMethod === 'BOTH') {
      if (email) {
        await this.sendEmail(email, 'هشدار سیستم پارکینگ', notification.message);
      }
    }
  }

  /**
   * Generate alert message
   */
  private static generateAlertMessage(
    alert: VehicleAlert,
    eventType: 'ENTRY' | 'EXIT',
    timestamp: Date
  ): string {
    if (alert.customMessage) {
      return alert.customMessage
        .replace('{plateNumber}', alert.plateNumber)
        .replace('{eventType}', eventType === 'ENTRY' ? 'ورود' : 'خروج')
        .replace('{time}', timestamp.toLocaleString('fa-IR'))
        .replace('{alertType}', this.getAlertTypeText(alert.alertType));
    }

    const eventText = eventType === 'ENTRY' ? 'ورود' : 'خروج';
    const alertTypeText = this.getAlertTypeText(alert.alertType);
    const timeText = timestamp.toLocaleString('fa-IR');

    switch (alert.alertType) {
      case AlertType.BLACKLIST:
        return `🚨 هشدار: خودرو بلاک‌شده ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;

      case AlertType.VIP:
        return `⭐ خودرو VIP ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;

      case AlertType.SECURITY_WATCH:
        return `👮 خودرو تحت نظارت امنیتی ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;

      case AlertType.EMERGENCY_VEHICLE:
        return `🚑 خودرو اضطراری ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;

      case AlertType.STAFF_VEHICLE:
        return `👤 خودرو پرسنل ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;

      default:
        return `📢 ${alertTypeText}: خودرو ${alert.plateNumber} در حال ${eventText} است.\nزمان: ${timeText}`;
    }
  }

  /**
   * Get alert type text in Persian
   */
  private static getAlertTypeText(alertType: AlertType): string {
    switch (alertType) {
      case AlertType.BLACKLIST: return 'خودرو بلاک‌شده';
      case AlertType.VIP: return 'خودرو VIP';
      case AlertType.SECURITY_WATCH: return 'تحت نظارت امنیتی';
      case AlertType.FREQUENT_VISITOR: return 'مراجع دائمی';
      case AlertType.STAFF_VEHICLE: return 'خودرو پرسنل';
      case AlertType.EMERGENCY_VEHICLE: return 'خودرو اضطراری';
      case AlertType.CUSTOM: return 'هشدار سفارشی';
      default: return 'نامشخص';
    }
  }

  /**
   * Check if alert should trigger for this event
   */
  private static shouldTriggerAlert(alert: VehicleAlert, eventType: 'ENTRY' | 'EXIT'): boolean {
    if (!alert.isActive) return false;

    switch (alert.triggerEvent) {
      case TriggerEvent.ENTRY_ONLY:
        return eventType === 'ENTRY' && alert.notifyOnEntry;
      case TriggerEvent.EXIT_ONLY:
        return eventType === 'EXIT' && alert.notifyOnExit;
      case TriggerEvent.BOTH:
        return (eventType === 'ENTRY' && alert.notifyOnEntry) || 
               (eventType === 'EXIT' && alert.notifyOnExit);
      default:
        return false;
    }
  }

  /**
   * Get active alerts for a vehicle
   */
  private static async getActiveAlertsForVehicle(plateNumber: string): Promise<VehicleAlert[]> {
    const alerts: VehicleAlert[] = [];
    
    // Check exact plate number match
    const exactMatch = this.alerts.get(plateNumber);
    if (exactMatch && exactMatch.isActive) {
      alerts.push(exactMatch);
    }

    // Check pattern matches (for partial plate numbers)
    for (const [plate, alert] of this.alerts) {
      if (alert.isActive && plate !== plateNumber) {
        if (this.plateMatches(plateNumber, plate)) {
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Check if plate numbers match (including pattern matching)
   */
  private static plateMatches(plateNumber: string, pattern: string): boolean {
    // Exact match
    if (plateNumber === pattern) return true;

    // Pattern matching (using * as wildcard)
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(plateNumber);
    }

    // Partial matching
    if (pattern.length < plateNumber.length) {
      return plateNumber.includes(pattern);
    }

    return false;
  }

  /**
   * Get user by ID (mock implementation)
   */
  private static async getUserById(userId: string): Promise<User | null> {
    // Mock implementation - in production, this would query the database
    return {
      id: userId,
      email: `user${userId}@example.com`,
      username: `user${userId}`,
      name: `User ${userId}`,
      password: 'hashed_password',
      role: 'SUPERVISOR',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get user phone number (mock implementation)
   */
  private static getUserPhone(user: User): string | undefined {
    // In production, this would come from user profile or additional table
    return `0912${user.id.slice(-7)}`;
  }

  /**
   * Send SMS (mock implementation)
   */
  private static async sendSMS(phoneNumber: string, message: string): Promise<void> {
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    // In production, integrate with SMS service provider
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send Email (mock implementation)
   */
  private static async sendEmail(email: string, subject: string, message: string): Promise<void> {
    console.log(`Sending email to ${email} with subject "${subject}": ${message}`);
    // In production, integrate with email service provider
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get alert history
   */
  static getAlertHistory(limit: number = 50, offset: number = 0): AlertNotification[] {
    return this.notifications
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): VehicleAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.isActive);
  }

  /**
   * Update alert
   */
  static async updateAlert(alertId: string, updates: Partial<VehicleAlert>): Promise<VehicleAlert | null> {
    const alert = Array.from(this.alerts.values()).find(a => a.id === alertId);
    if (!alert) return null;

    Object.assign(alert, updates, { updatedAt: new Date() });
    this.alerts.set(alert.plateNumber, alert);
    return alert;
  }

  /**
   * Delete alert
   */
  static async deleteAlert(alertId: string): Promise<boolean> {
    const alert = Array.from(this.alerts.values()).find(a => a.id === alertId);
    if (!alert) return false;

    this.alerts.delete(alert.plateNumber);
    return true;
  }

  /**
   * Bulk create alerts from vehicle list
   */
  static async createBulkAlerts(
    vehicles: { plateNumber: string; alertType: AlertType; description?: string }[],
    commonSettings: Partial<VehicleAlert>,
    createdBy: string
  ): Promise<VehicleAlert[]> {
    const alerts: VehicleAlert[] = [];

    for (const vehicle of vehicles) {
      const alert = await this.createVehicleAlert({
        vehicleId: `vehicle_${vehicle.plateNumber}`,
        plateNumber: vehicle.plateNumber,
        alertType: vehicle.alertType,
        alertLevel: AlertLevel.MEDIUM,
        triggerEvent: TriggerEvent.BOTH,
        message: vehicle.description || `Alert for ${vehicle.plateNumber}`,
        description: vehicle.description,
        isActive: true,
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyManagers: true,
        notifySecurity: false,
        managersToNotify: [],
        securityToNotify: [],
        createdBy,
        vehicleType: 'CAR',
        ...commonSettings
      });
      alerts.push(alert);
    }

    return alerts;
  }
}