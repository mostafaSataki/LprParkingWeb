import { Backup, BackupType, BackupStatus } from '@prisma/interface';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  autoBackup: boolean;
  backupInterval: number; // in hours
  maxBackups: number;
  backupPath: string;
  includeFiles: string[];
  excludeFiles: string[];
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  duration: number;
}

export interface BackupSchedule {
  id: string;
  name: string;
  type: BackupType;
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // HH:MM format
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  config: BackupConfig;
}

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private schedules: BackupSchedule[] = [];
  private isRunning = false;

  private constructor() {
    this.initializeDefaultConfig();
    this.initializeDefaultSchedules();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Initialize default backup configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      enabled: true,
      autoBackup: true,
      backupInterval: 24, // 24 hours
      maxBackups: 30,
      backupPath: path.join(process.cwd(), 'backups'),
      includeFiles: [
        'database.sqlite',
        'uploads/',
        'config/',
        'logs/'
      ],
      excludeFiles: [
        'node_modules/',
        '.git/',
        'dist/',
        'build/'
      ],
      compression: true,
      encryption: false
    };
  }

  /**
   * Initialize default backup schedules
   */
  private initializeDefaultSchedules(): void {
    const now = new Date();
    
    this.schedules = [
      {
        id: 'daily_backup',
        name: 'پشتیبان‌گیری روزانه',
        type: BackupType.AUTOMATIC,
        frequency: 'DAILY',
        time: '02:00',
        enabled: true,
        nextRun: this.getNextRunTime('02:00', 'DAILY'),
        config: { ...this.config }
      },
      {
        id: 'weekly_backup',
        name: 'پشتیبان‌گیری هفتگی',
        type: BackupType.AUTOMATIC,
        frequency: 'WEEKLY',
        time: '03:00',
        enabled: true,
        nextRun: this.getNextRunTime('03:00', 'WEEKLY'),
        config: { ...this.config, compression: true }
      },
      {
        id: 'monthly_backup',
        name: 'پشتیبان‌گیری ماهانه',
        type: BackupType.AUTOMATIC,
        frequency: 'MONTHLY',
        time: '04:00',
        enabled: true,
        nextRun: this.getNextRunTime('04:00', 'MONTHLY'),
        config: { ...this.config, compression: true, encryption: true }
      }
    ];
  }

  /**
   * Create manual backup
   */
  async createManualBackup(description?: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enabled) {
        return {
          success: false,
          error: 'سیستم پشتیبان‌گیری غیرفعال است',
          duration: Date.now() - startTime
        };
      }

      const backupId = `backup_${Date.now()}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.tar${this.config.compression ? '.gz' : ''}`;
      const filePath = path.join(this.config.backupPath, filename);

      // Ensure backup directory exists
      await this.ensureDirectoryExists(this.config.backupPath);

      // Create backup
      await this.createBackupFile(filePath, description);

      const stats = await fs.promises.stat(filePath);
      
      // Clean old backups if needed
      await this.cleanOldBackups();

      return {
        success: true,
        backupId,
        filename,
        filePath,
        fileSize: stats.size,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در ایجاد پشتیبان',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Create scheduled backup
   */
  async createScheduledBackup(scheduleId: string): Promise<BackupResult> {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      return {
        success: false,
        error: 'برنامه پشتیبان‌گیری یافت نشد',
        duration: 0
      };
    }

    const startTime = Date.now();
    
    try {
      const backupId = `backup_${scheduleId}_${Date.now()}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${schedule.name}_${timestamp}.tar${schedule.config.compression ? '.gz' : ''}`;
      const filePath = path.join(schedule.config.backupPath, filename);

      await this.ensureDirectoryExists(schedule.config.backupPath);
      await this.createBackupFile(filePath, `پشتیبان‌گیری برنامه‌ریزی شده: ${schedule.name}`);

      const stats = await fs.promises.stat(filePath);
      
      // Update schedule last run time
      schedule.lastRun = new Date();
      schedule.nextRun = this.getNextRunTime(schedule.time, schedule.frequency);

      return {
        success: true,
        backupId,
        filename,
        filePath,
        fileSize: stats.size,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در ایجاد پشتیبان برنامه‌ریزی شده',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Restore backup
   */
  async restoreBackup(backupPath: string, targetPath?: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: 'فایل پشتیبان یافت نشد',
          duration: Date.now() - startTime
        };
      }

      const restorePath = targetPath || process.cwd();
      
      // Create temporary directory for extraction
      const tempDir = path.join(restorePath, 'temp_restore');
      await this.ensureDirectoryExists(tempDir);

      // Extract backup
      if (backupPath.endsWith('.gz')) {
        await execAsync(`tar -xzf ${backupPath} -C ${tempDir}`);
      } else {
        await execAsync(`tar -xf ${backupPath} -C ${tempDir}`);
      }

      // Validate backup integrity
      const isValid = await this.validateBackup(tempDir);
      if (!isValid) {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        return {
          success: false,
          error: 'پشتیبان نامعتبر است',
          duration: Date.now() - startTime
        };
      }

      // Move files to target location
      await this.restoreFiles(tempDir, restorePath);

      // Clean up temporary directory
      await fs.promises.rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در بازیابی پشتیبان',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get backup list
   */
  async getBackupList(): Promise<Array<{
    id: string;
    filename: string;
    filePath: string;
    fileSize: number;
    createdAt: Date;
    type: BackupType;
    status: BackupStatus;
  }>> {
    try {
      if (!fs.existsSync(this.config.backupPath)) {
        return [];
      }

      const files = await fs.promises.readdir(this.config.backupPath);
      const backups = [];

      for (const file of files) {
        if (file.startsWith('backup_') && (file.endsWith('.tar') || file.endsWith('.tar.gz'))) {
          const filePath = path.join(this.config.backupPath, file);
          const stats = await fs.promises.stat(filePath);
          
          backups.push({
            id: file.replace('.tar', '').replace('.gz', ''),
            filename: file,
            filePath,
            fileSize: stats.size,
            createdAt: stats.birthtime,
            type: file.includes('scheduled') ? BackupType.SCHEDULED : BackupType.MANUAL,
            status: BackupStatus.COMPLETED
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupPath: string): Promise<boolean> {
    try {
      if (fs.existsSync(backupPath)) {
        await fs.promises.unlink(backupPath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get backup schedules
   */
  getSchedules(): BackupSchedule[] {
    return [...this.schedules];
  }

  /**
   * Update backup schedule
   */
  updateSchedule(scheduleId: string, updates: Partial<BackupSchedule>): boolean {
    const scheduleIndex = this.schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return false;

    this.schedules[scheduleIndex] = { ...this.schedules[scheduleIndex], ...updates };
    return true;
  }

  /**
   * Start backup scheduler
   */
  startScheduler(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNextCheck();
  }

  /**
   * Stop backup scheduler
   */
  stopScheduler(): void {
    this.isRunning = false;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup?: Date;
    nextScheduledBackup?: Date;
  }> {
    const backups = await this.getBackupList();
    const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);
    const lastBackup = backups.length > 0 ? backups[0].createdAt : undefined;
    const nextScheduledBackup = this.schedules
      .filter(s => s.enabled)
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())[0]?.nextRun;

    return {
      totalBackups: backups.length,
      totalSize,
      lastBackup,
      nextScheduledBackup
    };
  }

  // Private helper methods
  private async createBackupFile(filePath: string, description?: string): Promise<void> {
    const includeArgs = this.config.includeFiles.map(file => `--include='${file}'`).join(' ');
    const excludeArgs = this.config.excludeFiles.map(file => `--exclude='${file}'`).join(' ');
    const compressArg = this.config.compression ? 'z' : '';
    
    const command = `tar -c${compressArg}f ${filePath} ${includeArgs} ${excludeArgs} .`;
    
    await execAsync(command);

    // Create metadata file
    const metadata = {
      createdAt: new Date().toISOString(),
      description: description || 'پشتیبان‌گیری دستی',
      config: this.config,
      version: '1.0'
    };

    const metadataPath = filePath + '.meta';
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  private async cleanOldBackups(): Promise<void> {
    const backups = await this.getBackupList();
    if (backups.length <= this.config.maxBackups) return;

    const backupsToDelete = backups.slice(this.config.maxBackups);
    for (const backup of backupsToDelete) {
      await this.deleteBackup(backup.filePath);
      
      // Delete metadata file if exists
      const metadataPath = backup.filePath + '.meta';
      if (fs.existsSync(metadataPath)) {
        await fs.promises.unlink(metadataPath);
      }
    }
  }

  private async validateBackup(backupPath: string): Promise<boolean> {
    // Check for essential files
    const essentialFiles = ['database.sqlite', 'config/'];
    for (const file of essentialFiles) {
      const filePath = path.join(backupPath, file);
      if (!fs.existsSync(filePath)) {
        return false;
      }
    }
    return true;
  }

  private async restoreFiles(sourcePath: string, targetPath: string): Promise<void> {
    const files = await fs.promises.readdir(sourcePath, { withFileTypes: true });
    
    for (const file of files) {
      const sourceFilePath = path.join(sourcePath, file.name);
      const targetFilePath = path.join(targetPath, file.name);
      
      if (file.isDirectory()) {
        await this.ensureDirectoryExists(targetFilePath);
        await this.restoreFiles(sourceFilePath, targetFilePath);
      } else {
        await fs.promises.copyFile(sourceFilePath, targetFilePath);
      }
    }
  }

  private getNextRunTime(time: string, frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    let nextRun = new Date(now);
    
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (nextRun <= now) {
      switch (frequency) {
        case 'HOURLY':
          nextRun.setHours(nextRun.getHours() + 1);
          break;
        case 'DAILY':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'WEEKLY':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'MONTHLY':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }
    
    return nextRun;
  }

  private scheduleNextCheck(): void {
    if (!this.isRunning) return;

    setTimeout(() => {
      this.checkScheduledBackups();
      this.scheduleNextCheck();
    }, 60000); // Check every minute
  }

  private async checkScheduledBackups(): Promise<void> {
    const now = new Date();
    
    for (const schedule of this.schedules) {
      if (schedule.enabled && now >= schedule.nextRun) {
        await this.createScheduledBackup(schedule.id);
      }
    }
  }
}