import { User, UserRole, Permission, RolePermission } from '@prisma/client';

export interface UserWithPermissions extends User {
  permissions: Permission[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
  granted: boolean;
}

export interface AuthContext {
  user: UserWithPermissions | null;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserWithPermissions | null = null;
  private permissions: Permission[] = [];
  private rolePermissions: RolePermission[] = [];

  private constructor() {
    this.initializeDefaultPermissions();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize default permissions
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: Omit<Permission, 'id' | 'createdAt'>[] = [
      // Dashboard permissions
      { name: 'view_dashboard', description: 'مشاهده داشبورد', resource: 'dashboard', action: 'read' },
      
      // Vehicle management permissions
      { name: 'view_vehicles', description: 'مشاهده لیست خودروها', resource: 'vehicles', action: 'read' },
      { name: 'add_vehicle', description: 'افزودن خودرو جدید', resource: 'vehicles', action: 'create' },
      { name: 'edit_vehicle', description: 'ویرایش اطلاعات خودرو', resource: 'vehicles', action: 'update' },
      { name: 'delete_vehicle', description: 'حذف خودرو', resource: 'vehicles', action: 'delete' },
      
      // Tariff management permissions
      { name: 'view_tariffs', description: 'مشاهده تعرفه‌ها', resource: 'tariffs', action: 'read' },
      { name: 'add_tariff', description: 'افزودن تعرفه جدید', resource: 'tariffs', action: 'create' },
      { name: 'edit_tariff', description: 'ویرایش تعرفه', resource: 'tariffs', action: 'update' },
      { name: 'delete_tariff', description: 'حذف تعرفه', resource: 'tariffs', action: 'delete' },
      
      // Vehicle group permissions
      { name: 'view_vehicle_groups', description: 'مشاهده گروه‌های خودرو', resource: 'vehicle_groups', action: 'read' },
      { name: 'add_vehicle_group', description: 'افزودن گروه خودرو جدید', resource: 'vehicle_groups', action: 'create' },
      { name: 'edit_vehicle_group', description: 'ویرایش گروه خودرو', resource: 'vehicle_groups', action: 'update' },
      { name: 'delete_vehicle_group', description: 'حذف گروه خودرو', resource: 'vehicle_groups', action: 'delete' },
      
      // Session management permissions
      { name: 'view_sessions', description: 'مشاهده جلسات پارکینگ', resource: 'sessions', action: 'read' },
      { name: 'create_session', description: 'ایجاد جلسه جدید', resource: 'sessions', action: 'create' },
      { name: 'edit_session', description: 'ویرایش جلسه', resource: 'sessions', action: 'update' },
      { name: 'delete_session', description: 'حذف جلسه', resource: 'sessions', action: 'delete' },
      
      // Payment management permissions
      { name: 'view_payments', description: 'مشاهده پرداخت‌ها', resource: 'payments', action: 'read' },
      { name: 'create_payment', description: 'ایجاد پرداخت جدید', resource: 'payments', action: 'create' },
      { name: 'refund_payment', description: 'بازپرداخت پرداخت', resource: 'payments', action: 'refund' },
      
      // User management permissions
      { name: 'view_users', description: 'مشاهده کاربران', resource: 'users', action: 'read' },
      { name: 'add_user', description: 'افزودن کاربر جدید', resource: 'users', action: 'create' },
      { name: 'edit_user', description: 'ویرایش کاربر', resource: 'users', action: 'update' },
      { name: 'delete_user', description: 'حذف کاربر', resource: 'users', action: 'delete' },
      { name: 'manage_user_permissions', description: 'مدیریت دسترسی‌های کاربران', resource: 'users', action: 'manage_permissions' },
      
      // Shift management permissions
      { name: 'view_shifts', description: 'مشاهده شیفت‌ها', resource: 'shifts', action: 'read' },
      { name: 'create_shift', description: 'ایجاد شیفت جدید', resource: 'shifts', action: 'create' },
      { name: 'edit_shift', description: 'ویرایش شیفت', resource: 'shifts', action: 'update' },
      { name: 'delete_shift', description: 'حذف شیفت', resource: 'shifts', action: 'delete' },
      
      // Report permissions
      { name: 'view_reports', description: 'مشاهده گزارش‌ها', resource: 'reports', action: 'read' },
      { name: 'generate_reports', description: 'تولید گزارش', resource: 'reports', action: 'create' },
      { name: 'export_reports', description: 'خروجی گرفتن از گزارش‌ها', resource: 'reports', action: 'export' },
      
      // System settings permissions
      { name: 'view_settings', description: 'مشاهده تنظیمات سیستم', resource: 'settings', action: 'read' },
      { name: 'edit_settings', description: 'ویرایش تنظیمات سیستم', resource: 'settings', action: 'update' },
      
      // Hardware management permissions
      { name: 'view_hardware', description: 'مشاهده تجهیزات سخت‌افزاری', resource: 'hardware', action: 'read' },
      { name: 'configure_hardware', description: 'پیکربندی تجهیزات سخت‌افزاری', resource: 'hardware', action: 'configure' },
      { name: 'control_hardware', description: 'کنترل تجهیزات سخت‌افزاری', resource: 'hardware', action: 'control' },
      
      // Backup permissions
      { name: 'view_backups', description: 'مشاهده نسخه‌های پشتیبان', resource: 'backups', action: 'read' },
      { name: 'create_backup', description: 'ایجاد نسخه پشتیبان', resource: 'backups', action: 'create' },
      { name: 'restore_backup', description: 'بازیابی نسخه پشتیبان', resource: 'backups', action: 'restore' },
      
      // Credit system permissions
      { name: 'view_credits', description: 'مشاهده حساب‌های اعتباری', resource: 'credits', action: 'read' },
      { name: 'manage_credits', description: 'مدیریت حساب‌های اعتباری', resource: 'credits', action: 'manage' },
      { name: 'charge_credit', description: 'شارژ حساب اعتباری', resource: 'credits', action: 'charge' },
      
      // Audit permissions
      { name: 'view_audit_logs', description: 'مشاهده لاگ‌های حسابرسی', resource: 'audit', action: 'read' },
      { name: 'export_audit_logs', description: 'خروجی لاگ‌های حسابرسی', resource: 'audit', action: 'export' }
    ];

    // Convert to Permission objects with IDs
    this.permissions = defaultPermissions.map((p, index) => ({
      ...p,
      id: `perm_${index + 1}`,
      createdAt: new Date()
    }));

    // Initialize default role permissions
    this.initializeDefaultRolePermissions();
  }

  /**
   * Initialize default role permissions
   */
  private initializeDefaultRolePermissions(): void {
    const rolePermissions: Omit<RolePermission, 'id' | 'createdAt'>[] = [
      // OPERATOR permissions
      ...this.permissions
        .filter(p => 
          p.resource === 'dashboard' ||
          p.resource === 'sessions' ||
          p.resource === 'payments' ||
          p.resource === 'vehicles' ||
          p.resource === 'shifts' ||
          p.resource === 'reports'
        )
        .filter(p => 
          p.action === 'read' || 
          p.action === 'create' || 
          p.action === 'update'
        )
        .map(p => ({ userRole: UserRole.OPERATOR, permissionId: p.id })),
      
      // SUPERVISOR permissions
      ...this.permissions
        .filter(p => 
          p.resource === 'dashboard' ||
          p.resource === 'sessions' ||
          p.resource === 'payments' ||
          p.resource === 'vehicles' ||
          p.resource === 'tariffs' ||
          p.resource === 'vehicle_groups' ||
          p.resource === 'shifts' ||
          p.resource === 'reports' ||
          p.resource === 'users' ||
          p.resource === 'credits'
        )
        .filter(p => 
          p.action === 'read' || 
          p.action === 'create' || 
          p.action === 'update' ||
          p.action === 'export'
        )
        .map(p => ({ userRole: UserRole.SUPERVISOR, permissionId: p.id })),
      
      // ADMIN permissions - all permissions
      ...this.permissions
        .map(p => ({ userRole: UserRole.ADMIN, permissionId: p.id })),
      
      // AUDITOR permissions
      ...this.permissions
        .filter(p => 
          p.resource === 'dashboard' ||
          p.resource === 'sessions' ||
          p.resource === 'payments' ||
          p.resource === 'reports' ||
          p.resource === 'audit' ||
          p.resource === 'backups'
        )
        .filter(p => p.action === 'read' || p.action === 'export')
        .map(p => ({ userRole: UserRole.AUDITOR, permissionId: p.id }))
    ];

    this.rolePermissions = rolePermissions.map((rp, index) => ({
      ...rp,
      id: `role_perm_${index + 1}`,
      createdAt: new Date()
    }));
  }

  /**
   * Authenticate user
   */
  async login(username: string, password: string): Promise<UserWithPermissions | null> {
    // Mock authentication - in real app, this would verify against database
    const mockUsers: UserWithPermissions[] = [
      {
        id: 'user_1',
        email: 'admin@parking.com',
        username: 'admin',
        name: 'مدیر سیستم',
        password: 'hashed_password', // In real app, this would be hashed
        role: UserRole.ADMIN,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: this.getUserPermissions(UserRole.ADMIN)
      },
      {
        id: 'user_2',
        email: 'operator@parking.com',
        username: 'operator',
        name: 'اپراتور',
        password: 'hashed_password',
        role: UserRole.OPERATOR,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: this.getUserPermissions(UserRole.OPERATOR)
      },
      {
        id: 'user_3',
        email: 'supervisor@parking.com',
        username: 'supervisor',
        name: 'سرپرست',
        password: 'hashed_password',
        role: UserRole.SUPERVISOR,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: this.getUserPermissions(UserRole.SUPERVISOR)
      },
      {
        id: 'user_4',
        email: 'auditor@parking.com',
        username: 'auditor',
        name: 'حسابرس',
        password: 'hashed_password',
        role: UserRole.AUDITOR,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: this.getUserPermissions(UserRole.AUDITOR)
      }
    ];

    const user = mockUsers.find(u => u.username === username);
    if (user && user.isActive) {
      // In real app, verify password hash
      this.currentUser = user;
      return user;
    }

    return null;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserWithPermissions | null {
    return this.currentUser;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser) return false;
    
    return this.currentUser.permissions.some(p => 
      p.resource === resource && p.action === action
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Array<{ resource: string; action: string }>): boolean {
    if (!this.currentUser) return false;
    
    return permissions.some(({ resource, action }) => 
      this.currentUser!.permissions.some(p => 
        p.resource === resource && p.action === action
      )
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: Array<{ resource: string; action: string }>): boolean {
    if (!this.currentUser) return false;
    
    return permissions.every(({ resource, action }) => 
      this.currentUser!.permissions.some(p => 
        p.resource === resource && p.action === action
      )
    );
  }

  /**
   * Get user permissions by role
   */
  getUserPermissions(role: UserRole): Permission[] {
    const rolePermissionIds = this.rolePermissions
      .filter(rp => rp.userRole === role)
      .map(rp => rp.permissionId);
    
    return this.permissions.filter(p => rolePermissionIds.includes(p.id));
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return [...this.permissions];
  }

  /**
   * Get all role permissions
   */
  getAllRolePermissions(): RolePermission[] {
    return [...this.rolePermissions];
  }

  /**
   * Create auth context for React components
   */
  createAuthContext(): AuthContext {
    return {
      user: this.currentUser,
      isAuthenticated: this.currentUser !== null,
      hasPermission: (resource: string, action: string) => this.hasPermission(resource, action),
      hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => this.hasAnyPermission(permissions),
      hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => this.hasAllPermissions(permissions),
      login: async (username: string, password: string) => {
        const user = await this.login(username, password);
        return user !== null;
      },
      logout: () => this.logout()
    };
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(route: string): boolean {
    const routePermissions = this.getRoutePermissions(route);
    return this.hasAnyPermission(routePermissions);
  }

  /**
   * Get required permissions for a route
   */
  private getRoutePermissions(route: string): Array<{ resource: string; action: string }> {
    const routeMap: Record<string, Array<{ resource: string; action: string }>> = {
      '/': [{ resource: 'dashboard', action: 'read' }],
      '/tariffs': [{ resource: 'tariffs', action: 'read' }],
      '/vehicle-groups': [{ resource: 'vehicle_groups', action: 'read' }],
      '/sessions': [{ resource: 'sessions', action: 'read' }],
      '/payments': [{ resource: 'payments', action: 'read' }],
      '/users': [{ resource: 'users', action: 'read' }],
      '/shifts': [{ resource: 'shifts', action: 'read' }],
      '/reports': [{ resource: 'reports', action: 'read' }],
      '/hardware': [{ resource: 'hardware', action: 'read' }],
      '/settings': [{ resource: 'settings', action: 'read' }],
      '/backups': [{ resource: 'backups', action: 'read' }],
      '/credits': [{ resource: 'credits', action: 'read' }],
      '/audit': [{ resource: 'audit', action: 'read' }]
    };

    return routeMap[route] || [];
  }

  /**
   * Get user role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.OPERATOR]: 'اپراتور',
      [UserRole.SUPERVISOR]: 'سرپرست',
      [UserRole.ADMIN]: 'مدیر سیستم',
      [UserRole.AUDITOR]: 'حسابرس'
    };

    return roleNames[role];
  }

  /**
   * Check if user can perform admin actions
   */
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  /**
   * Check if user can perform supervisor actions
   */
  isSupervisor(): boolean {
    return this.currentUser?.role === UserRole.SUPERVISOR || this.currentUser?.role === UserRole.ADMIN;
  }

  /**
   * Check if user can perform auditor actions
   */
  isAuditor(): boolean {
    return this.currentUser?.role === UserRole.AUDITOR || this.currentUser?.role === UserRole.ADMIN;
  }
}