import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];

export interface JWTPayload {
  userId: number;
  email: string;
  employeeUid?: string;
  employeeId?: number;
  roleId?: number;
  organizationId?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload as object, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

// Get auth token from request (for API routes)
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    return token || null;
  } catch {
    return null;
  }
};

// Get user from request
export const getUserFromRequest = async (request: NextRequest): Promise<JWTPayload | null> => {
  let token: string | undefined;

  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check Cookie if no header
  if (!token) {
    const cookieToken = request.cookies.get('token');
    if (cookieToken) {
      token = cookieToken.value;
    }
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
};

// Auth middleware helper
export const withAuth = async (
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<Response>
): Promise<Response> => {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json(
      { success: false, code: 401, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(user);
};

// Generate OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP Cache (in production, use Redis)
const otpCache = new Map<string, { otp: string; expires: number }>();

export const storeOTP = (userId: string, otp: string, expiresInMinutes: number = 10): void => {
  otpCache.set(userId, {
    otp,
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
};

export const verifyOTP = (userId: string, otp: string): boolean => {
  const stored = otpCache.get(userId);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expires) {
    otpCache.delete(userId);
    return false;
  }

  if (stored.otp !== otp) {
    return false;
  }

  otpCache.delete(userId);
  return true;
};

export const clearOTP = (userId: string): void => {
  otpCache.delete(userId);
};

// Get menus for role
export const getMenusForRole = async (roleId: number, organizationId: number) => {
  const menus = await prisma.menuMaster.findMany({
    where: {
      status: true,
      type: 'Menu',
      permissions: {
        some: {
          rolePermissions: {
            some: {
              role_id: roleId,
              organization_id: organizationId,
              status: true,
            },
          },
        },
      },
    },
    include: {
      permissions: {
        where: {
          description: { contains: 'menu' },
          rolePermissions: {
            some: {
              role_id: roleId,
              organization_id: organizationId,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  // Get submenus
  const menuIds = menus.map(m => m.id);
  const subMenus = await prisma.menuMaster.findMany({
    where: {
      status: true,
      type: 'SubMenu',
      parent_menu_id: { in: menuIds },
      permissions: {
        some: {
          rolePermissions: {
            some: {
              role_id: roleId,
              organization_id: organizationId,
              status: true,
            },
          },
        },
      },
    },
    include: {
      permissions: {
        where: {
          description: { contains: 'menu' },
        },
      },
    },
  });

  // Build menu tree
  return menus.map(menu => ({
    id: menu.id,
    name: menu.menu_name,
    routeUrl: menu.route_url,
    fontIcon: menu.font_icon,
    type: menu.type,
    SubMenu: subMenus
      .filter(sub => sub.parent_menu_id === menu.id)
      .map(sub => ({
        id: sub.id,
        name: sub.menu_name,
        routeUrl: sub.route_url,
        fontIcon: sub.font_icon,
        type: sub.type,
      })),
  }));
};

// Get permissions for role
export const getPermissionsForRole = async (roleId: number, organizationId: number): Promise<string[]> => {
  const permissions = await prisma.permission.findMany({
    where: {
      status_master_id: true,
      rolePermissions: {
        some: {
          role_id: roleId,
          organization_id: organizationId,
          status: true,
        },
      },
    },
    select: {
      description: true,
    },
  });

  return permissions.map(p => p.description).filter((d): d is string => d !== null);
};

// Log login attempt
export const logLoginAttempt = async (
  email: string,
  url: string,
  browser: string,
  ipAddress: string,
  success: boolean,
  google2fa: boolean = false
) => {
  try {
    await prisma.loginLog.create({
      data: {
        login_email: email.substring(0, 50),
        login_url: url.substring(0, 100),
        logged_in_date_time: new Date(),
        google2fa: google2fa,
        browser: browser.substring(0, 150),
        ip_address: ipAddress.substring(0, 50),
        login_status: success,
      },
    });
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

// Generate unique employee UID
export const generateEmployeeUID = async (): Promise<string> => {
  const lastEmployee = await prisma.employeeOnboarding.findFirst({
    orderBy: { id: 'desc' },
    select: { uid: true },
  });

  let nextNumber = 1;
  if (lastEmployee?.uid) {
    const match = lastEmployee.uid.match(/EMP_(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `EMP_${nextNumber.toString().padStart(5, '0')}`;
};

// Generate unique client UID
export const generateClientUID = async (): Promise<string> => {
  const lastClient = await prisma.clients.findFirst({
    orderBy: { id: 'desc' },
    select: { client_id: true },
  });

  let nextNumber = 1;
  if (lastClient?.client_id) {
    const match = lastClient.client_id.match(/CLI_(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `CLI_${nextNumber.toString().padStart(5, '0')}`;
};

