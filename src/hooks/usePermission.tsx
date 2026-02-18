"use client"

import { useAuthStore } from '@/store/auth'

// Permission constants matching PHP backend
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
}

// Role IDs from database
export const ROLES = {
  SUPER_ADMIN: 1,
  HR: 2,
  FINANCE: 3,
  SALES: 4,
  OPERATIONS: 5,
  EMPLOYEE: 6,
  CLIENT: 7,
  VENDOR: 8,
}

// Role names
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.HR]: 'HR',
  [ROLES.FINANCE]: 'Finance',
  [ROLES.SALES]: 'Sales',
  [ROLES.OPERATIONS]: 'Operations',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.CLIENT]: 'Client',
  [ROLES.VENDOR]: 'Vendor',
}

// Admin roles that have elevated privileges
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.HR]

export function usePermission() {
  const user = useAuthStore(state => state.user)
  const hasPermission = useAuthStore(state => state.hasPermission)

  const isAdmin = () => {
    return ADMIN_ROLES.includes(user?.roleId || 0)
  }

  const isSuperAdmin = () => {
    return user?.roleId === ROLES.SUPER_ADMIN
  }

  const isHR = () => {
    return user?.roleId === ROLES.HR || user?.roleId === ROLES.SUPER_ADMIN
  }

  const isEmployee = () => {
    return user?.roleId === ROLES.EMPLOYEE
  }

  const isClient = () => {
    return user?.roleId === ROLES.CLIENT
  }

  const isVendor = () => {
    return user?.roleId === ROLES.VENDOR
  }

  const can = (permission: string) => {
    // Super admin has all permissions
    if (isSuperAdmin()) return true

    // Check if user has the specific permission
    return hasPermission(permission)
  }

  const canAny = (permissions: string[]) => {
    if (isSuperAdmin()) return true
    return permissions.some(p => hasPermission(p))
  }

  const canAll = (permissions: string[]) => {
    if (isSuperAdmin()) return true
    return permissions.every(p => hasPermission(p))
  }

  // Check if user can approve leaves
  const canApproveLeave = () => {
    return isAdmin() || can(PERMISSIONS.LEAVE_APPROVE)
  }

  // Check if user can manage employees
  const canManageEmployees = () => {
    return isAdmin() || canAny([PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_EDIT, PERMISSIONS.EMPLOYEE_DELETE])
  }

  // Check if user can manage master data
  const canManageMasters = () => {
    return isAdmin() || canAny([PERMISSIONS.MASTER_CREATE, PERMISSIONS.MASTER_EDIT, PERMISSIONS.MASTER_DELETE])
  }

  // Get role display name
  const getRoleName = () => {
    return user?.roleName || ROLE_NAMES[user?.roleId || 0] || 'User'
  }

  return {
    user,
    isAdmin,
    isSuperAdmin,
    isHR,
    isEmployee,
    isClient,
    isVendor,
    can,
    canAny,
    canAll,
    canApproveLeave,
    canManageEmployees,
    canManageMasters,
    getRoleName,
    PERMISSIONS,
    ROLES,
  }
}

// Higher-order component for permission-based rendering
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { can, canAny, canAll } = usePermission()

  let hasAccess = false

  if (permission) {
    hasAccess = can(permission)
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions)
  }

  if (!hasAccess) {
    return fallback
  }

  return <>{children}</>
}

// Admin-only gate
export function AdminGate({ fallback = null, children }: { fallback?: React.ReactNode, children: React.ReactNode }) {
  const { isAdmin } = usePermission()

  if (!isAdmin()) {
    return fallback
  }

  return <>{children}</>
}

