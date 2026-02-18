import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit, RateLimits, getClientIP } from '@/lib/rate-limit';
import { apiResponse, apiError, APIError, rateLimitError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per minute
    if (!checkRateLimit(request, RateLimits.AUTH_LOGIN.limit, RateLimits.AUTH_LOGIN.interval)) {
      return rateLimitError(RateLimits.AUTH_LOGIN.interval);
    }

    // Validate input
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Get client info for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = getClientIP(request);

    // Find user by email in login table
    const loginUser = await prisma.login.findFirst({
      where: {
        email,
        status: true,
        deleted_at: null,
      },
    });

    if (!loginUser) {
      await logLogin(email, ip, userAgent.substring(0, 150), false);
      throw APIError.unauthorized('Invalid email or password');
    }

    // Force OTP login if password is not set
    if (!loginUser.is_password_set) {
      await logLogin(email, ip, userAgent.substring(0, 150), false);
      throw APIError.unauthorized('Please login via OTP to set your password.');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, loginUser.password);

    if (!isValidPassword) {
      await logLogin(email, ip, userAgent.substring(0, 150), false);
      throw APIError.unauthorized('Invalid email or password');
    }

    // Get employee details using user_id
    const employee = await prisma.employeeOnboarding.findFirst({
      where: {
        uid: loginUser.user_id,
        status: true,
        deleted_at: null,
      },
      include: {
        role: true,
        designation_master: true,
        statusMaster: true,
      },
    });

    if (!employee) {
      await logLogin(email, ip, userAgent.substring(0, 150), false);
      throw APIError.unauthorized('Employee profile not found');
    }

    // Check if 2FA is enabled
    if (loginUser.google2fa === 1) {
      const secretKeyRecord = await prisma.employeeSecretkey.findFirst({
        where: { uid: loginUser.user_id },
        orderBy: { created_at: 'desc' },
      });

      return apiResponse({
        google2fa: 1,
        secretKey: secretKeyRecord?.secretkey,
        email: loginUser.email,
        user_id: loginUser.user_id,
      }, HttpStatus.OK);
    }

    // Get permissions for role
    const permissions = await prisma.rolePermission.findMany({
      where: {
        role_id: employee.role_master_id,
        status: true,
      },
      include: {
        permission: true,
      },
    });

    const permissionList = permissions
      .map(rp => rp.permission?.description)
      .filter((p): p is string => p !== null && p !== undefined);

    // Get menus for role
    const menus = await getMenusForRole(employee.role_master_id);

    // Generate token
    const token = generateToken({
      userId: loginUser.id,
      email: loginUser.email,
      employeeUid: loginUser.user_id,
      employeeId: employee.id,
      roleId: employee.role_master_id,
      organizationId: undefined,
    });

    // Log successful login
    await logLogin(email, ip, userAgent.substring(0, 150), true);

    return apiResponse({
      id: loginUser.id,
      user_id: loginUser.user_id,
      email: loginUser.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      employeeCode: employee.employee_code,
      employeePhoto: employee.employee_photo,
      employeeId: employee.id,
      roleId: employee.role_master_id,
      roleName: employee.role?.role_name,
      designationId: employee.designation_master_id,
      designationName: employee.designation_master?.designation_name,
      phoneNumber: employee.phone_number,
      doj: employee.doj,
      statusId: employee.status_master_id,
      statusName: employee.statusMaster?.status,
      permissions: permissionList,
      menus: { data: menus },
      google2fa: loginUser.google2fa,
      token,
    }, HttpStatus.OK);

  } catch (error) {
    return apiError(error);
  }
}

// Simple login log function
async function logLogin(email: string, ip: string, browser: string, success: boolean) {
  try {
    await prisma.loginLog.create({
      data: {
        login_email: email.substring(0, 50),
        login_url: '/api/auth/login',
        logged_in_date_time: new Date(),
        google2fa: false,
        browser: browser.substring(0, 150),
        ip_address: ip.substring(0, 50),
        login_status: success,
      },
    });
  } catch (err) {
    console.error('Failed to log login:', err);
  }
}

// Get menus for role - simplified approach
async function getMenusForRole(roleId: number) {
  try {
    // Get permissions for this role
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role_id: roleId,
        status: true,
      },
      select: {
        permission_id: true,
      },
    });

    const permissionIds = rolePermissions
      .map(rp => rp.permission_id)
      .filter((id): id is number => id !== null);

    if (permissionIds.length === 0) {
      return [];
    }

    // Get permissions with their menu relations
    const permissionsWithMenus = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
        menu_id: { not: null },
      },
      select: {
        menu_id: true,
      },
    });

    const menuIds = [...new Set(permissionsWithMenus
      .map(p => p.menu_id)
      .filter((id): id is number => id !== null))];

    if (menuIds.length === 0) {
      return [];
    }

    // Get all menus
    const allMenus = await prisma.menuMaster.findMany({
      where: {
        status: true,
      },
      orderBy: { order: 'asc' },
    });

    // Build menu tree - parent menus first
    const parentMenus = allMenus.filter(m => !m.parent_menu_id && menuIds.includes(m.id));
    const childMenus = allMenus.filter(m => m.parent_menu_id);

    return parentMenus.map(parent => ({
      id: parent.id,
      name: parent.menu_name,
      routeUrl: parent.route_url,
      fontIcon: parent.font_icon,
      type: parent.type,
      SubMenu: childMenus
        .filter(child => child.parent_menu_id === parent.id)
        .map(child => ({
          id: child.id,
          name: child.menu_name,
          routeUrl: child.route_url,
          fontIcon: child.font_icon,
          type: child.type,
        })),
    }));
  } catch (error) {
    console.error('Error fetching menus:', error);
    return [];
  }
}
