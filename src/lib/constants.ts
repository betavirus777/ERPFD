/**
 * Leave Status Constants
 */
export const LeaveStatus = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 4,
    CANCELLED: 27,
} as const;

export type LeaveStatusType = typeof LeaveStatus[keyof typeof LeaveStatus];

export const LeaveStatusLabel: Record<number, string> = {
    [LeaveStatus.PENDING]: 'Pending',
    [LeaveStatus.APPROVED]: 'Approved',
    [LeaveStatus.REJECTED]: 'Rejected',
    [LeaveStatus.CANCELLED]: 'Cancelled',
};

export const LeaveStatusColor: Record<number, string> = {
    [LeaveStatus.PENDING]: 'warning',
    [LeaveStatus.APPROVED]: 'success',
    [LeaveStatus.REJECTED]: 'destructive',
    [LeaveStatus.CANCELLED]: 'secondary',
};

/**
 * Family Relationship Constants
 */
export const FamilyRelationship = {
    FATHER: 1,
    MOTHER: 2,
    SPOUSE: 3,
    SIBLING: 4,
    CHILD: 5,
    SON: 6,
    DAUGHTER: 7,
    BROTHER: 8,
    SISTER: 9,
    FRIEND: 10,
    OTHER: 11,
} as const;

export const FamilyRelationshipLabel: Record<number, string> = {
    [FamilyRelationship.FATHER]: 'Father',
    [FamilyRelationship.MOTHER]: 'Mother',
    [FamilyRelationship.SPOUSE]: 'Spouse',
    [FamilyRelationship.SIBLING]: 'Sibling',
    [FamilyRelationship.CHILD]: 'Child',
    [FamilyRelationship.SON]: 'Son',
    [FamilyRelationship.DAUGHTER]: 'Daughter',
    [FamilyRelationship.BROTHER]: 'Brother',
    [FamilyRelationship.SISTER]: 'Sister',
    [FamilyRelationship.FRIEND]: 'Friend',
    [FamilyRelationship.OTHER]: 'Other',
};

/**
 * Marital Status Constants
 */
export const MaritalStatus = {
    SINGLE: 1,
    MARRIED: 2,
    DIVORCED: 3,
    WIDOWED: 4,
} as const;

export const MaritalStatusLabel: Record<number, string> = {
    [MaritalStatus.SINGLE]: 'Single',
    [MaritalStatus.MARRIED]: 'Married',
    [MaritalStatus.DIVORCED]: 'Divorced',
    [MaritalStatus.WIDOWED]: 'Widowed',
};

/**
 * Gender Constants
 */
export const Gender = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
} as const;

/**
 * Document Type Priority (for common documents)
 */
export const DocumentType = {
    PASSPORT: 'Passport',
    VISA: 'Visa',
    EMIRATES_ID: 'Emirates ID',
    LABOR_CONTRACT: 'Labor Contract',
    HEALTH_INSURANCE: 'Health Insurance',
} as const;

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Cache Durations (in seconds)
 */
export const CacheDuration = {
    NONE: 0,
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 600, // 10 minutes
    VERY_LONG: 3600, // 1 hour
} as const;

/**
 * Pagination Defaults
 */
export const Pagination = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    AVAILABLE_PAGE_SIZES: [10, 20, 30, 40, 50] as const,
} as const;

/**
 * Role IDs (sync with database)
 */
export const RoleId = {
    SUPER_ADMIN: 1,
    HR: 2,
    FINANCE: 3,
    SALES: 4,
    OPERATIONS: 5,
    EMPLOYEE: 6,
    CLIENT: 7,
    VENDOR: 8,
} as const;

/**
 * Permission Names (sync with database)
 */
export const PermissionName = {
    // Employee
    VIEW_EMPLOYEE: 'view_employee',
    CREATE_EMPLOYEE: 'create_employee',
    EDIT_EMPLOYEE: 'edit_employee',
    DELETE_EMPLOYEE: 'delete_employee',

    // Leave
    VIEW_LEAVE: 'view_leave',
    APPLY_LEAVE: 'apply_leave',
    APPROVE_LEAVE: 'approve_leave',
    REJECT_LEAVE: 'reject_leave',

    // Salary & Payroll
    VIEW_ALL_SALARIES: 'view_all_salaries',
    MANAGE_PAYROLL: 'manage_payroll',
} as const;

/**
 * Error Codes for API responses
 */
export const ErrorCode = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
} as const;
