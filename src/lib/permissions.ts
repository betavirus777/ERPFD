import { NextRequest } from 'next/server';
import { getUserFromRequest, JWTPayload } from './auth';
import prisma from './db';

// Permission constants - Keep in sync with frontend
export const ROLES = {
    SUPER_ADMIN: 1,
    HR: 2,
    FINANCE: 3,
    SALES: 4,
    OPERATIONS: 5,
    EMPLOYEE: 6,
    CLIENT: 7,
    VENDOR: 8,
} as const;

export const ADMIN_ROLES: number[] = [ROLES.SUPER_ADMIN, ROLES.HR];

// Permission constants - Keep in sync with frontend
export const PERMISSIONS = {
    // Employee permissions
    EMPLOYEE_VIEW: 'view_employee',
    EMPLOYEE_CREATE: 'create_employee',
    EMPLOYEE_EDIT: 'edit_employee',
    EMPLOYEE_DELETE: 'delete_employee',

    // Leave permissions
    LEAVE_VIEW: 'view_leave',
    LEAVE_APPLY: 'apply_leave',
    LEAVE_APPROVE: 'approve_leave',
    LEAVE_REJECT: 'reject_leave',
    LEAVE_CANCEL: 'cancel_leave',

    // Client permissions
    CLIENT_VIEW: 'view_client',
    CLIENT_CREATE: 'create_client',
    CLIENT_EDIT: 'edit_client',
    CLIENT_DELETE: 'delete_client',

    // Vendor permissions
    VENDOR_VIEW: 'view_vendor',
    VENDOR_CREATE: 'create_vendor',
    VENDOR_EDIT: 'edit_vendor',
    VENDOR_DELETE: 'delete_vendor',

    // Project permissions
    PROJECT_VIEW: 'view_project',
    PROJECT_CREATE: 'create_project',
    PROJECT_EDIT: 'edit_project',
    PROJECT_DELETE: 'delete_project',

    // Opportunity permissions
    OPPORTUNITY_VIEW: 'view_opportunity',
    OPPORTUNITY_CREATE: 'create_opportunity',
    OPPORTUNITY_EDIT: 'edit_opportunity',
    OPPORTUNITY_DELETE: 'delete_opportunity',

    // Invoice/Sales permissions
    INVOICE_VIEW: 'view_invoice',
    INVOICE_CREATE: 'create_invoice',
    INVOICE_EDIT: 'edit_invoice',
    INVOICE_DELETE: 'delete_invoice',

    // Expense permissions
    EXPENSE_VIEW: 'view_expense',
    EXPENSE_CREATE: 'create_expense',
    EXPENSE_EDIT: 'edit_expense',
    EXPENSE_DELETE: 'delete_expense',

    // Candidate permissions
    CANDIDATE_VIEW: 'view_candidate',
    CANDIDATE_CREATE: 'create_candidate',
    CANDIDATE_EDIT: 'edit_candidate',
    CANDIDATE_DELETE: 'delete_candidate',

    // Master data permissions
    MASTER_VIEW: 'view_master',
    MASTER_CREATE: 'create_master',
    MASTER_EDIT: 'edit_master',
    MASTER_DELETE: 'delete_master',

    // Access control permissions
    ACCESS_CONTROL_VIEW: 'view_access_control',
    ACCESS_CONTROL_EDIT: 'edit_access_control',

    // Dashboard permissions
    DASHBOARD_VIEW: 'view_dashboard',
    DASHBOARD_WIDGETS: 'manage_widgets',

    // Reports permissions
    REPORTS_VIEW: 'view_reports',
    REPORTS_EXPORT: 'export_reports',

    // Legacy/HR permissions
    VIEW_ALL_EMPLOYEES: 'view_all_employees',
    VIEW_ALL_SALARIES: 'view_all_salaries',
    MANAGE_PAYROLL: 'manage_payroll',
} as const;

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
    user: JWTPayload,
    permissionName: string
): Promise<boolean> {
    // Super admins have all permissions
    if (user.roleId === 1) return true;

    try {
        // Query database for user's permissions through their role
        const permission = await prisma.rolePermission.findFirst({
            where: {
                role_id: user.roleId,
                organization_id: user.organizationId,
                status: true,
                permission: {
                    description: permissionName,
                    status_master_id: true,
                },
            },
            include: {
                permission: true,
            },
        });

        return !!permission;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
    user: JWTPayload,
    permissions: string[]
): Promise<boolean> {
    if (user.roleId === 1) return true;

    for (const perm of permissions) {
        if (await hasPermission(user, perm)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if user can view other employees' data
 * HR and admins can view all, regular employees can only view their own
 */
export function canViewEmployeeData(
    user: JWTPayload,
    targetEmployeeUid: string
): boolean {
    // User can always view their own data
    if (user.employeeUid === targetEmployeeUid) {
        return true;
    }

    // Admin roles can view all employee data
    return ADMIN_ROLES.includes(user.roleId || 0);
}

/**
 * Middleware to check permissions and ownership
 * Returns user if authorized, null otherwise
 */
export async function authorizeEmployeeAccess(
    request: NextRequest,
    employeeUid: string,
    requiredPermission?: string
): Promise<JWTPayload | null> {
    const user = await getUserFromRequest(request);
    if (!user) return null;

    // Check if user can view this employee's data
    if (!canViewEmployeeData(user, employeeUid)) {
        return null;
    }

    // If specific permission is required, check it
    if (requiredPermission) {
        const hasPerm = await hasPermission(user, requiredPermission);
        if (!hasPerm) return null;
    }

    return user;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: JWTPayload): boolean {
    return ADMIN_ROLES.includes(user.roleId || 0);
}
