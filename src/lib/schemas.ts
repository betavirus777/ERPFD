import { z } from 'zod';

/**
 * Employee Bank Details Schema
 */
export const bankDetailsSchema = z.object({
    id: z.number().optional(),
    bank_name: z.string().min(2, 'Bank name must be at least 2 characters').max(100),
    bank_account_number: z.string().regex(/^[0-9]+$/, 'Account number must contain only digits'),
    recipient_name: z.string().min(2).max(100),
    bank_address: z.string().max(200).optional(),
    bank_swift_code: z.string().min(8).max(11).regex(/^[A-Z0-9]+$/, 'Invalid SWIFT code format').optional(),
    bank_iban_number: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'Invalid IBAN format').optional(),
});

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;

/**
 * Employee Family Info Schema
 */
export const familyInfoSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2).max(100),
    relationship: z.union([z.number().min(1).max(11), z.string()]),
    dob: z.string().or(z.date()).optional(),
    contact_number: z.string().regex(/^[0-9+\-() ]+$/).max(15).optional(),
});

export type FamilyInfoInput = z.infer<typeof familyInfoSchema>;

/**
 * Employee Education Schema
 */
export const educationSchema = z.object({
    id: z.number().optional(),
    institution: z.string().min(2).max(200),
    subject: z.string().min(2).max(100),
    degree: z.string().min(2).max(100),
    grade: z.string().max(50).optional(),
    start_date: z.string().or(z.date()),
    end_date: z.string().or(z.date()).optional(),
});

export type EducationInput = z.infer<typeof educationSchema>;

/**
 * Employee Experience Schema
 */
export const experienceSchema = z.object({
    id: z.number().optional(),
    company_name: z.string().min(2).max(200),
    location: z.string().max(100).optional(),
    job_position: z.string().min(2).max(100),
    start_date: z.string().or(z.date()),
    end_date: z.string().or(z.date()).optional(),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

/**
 * Emergency Contact Schema
 */
export const emergencyContactSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2).max(100),
    relationship: z.string().min(2).max(50),
    contact_number: z.string().regex(/^[0-9+\-() ]+$/).max(15),
    alternative_number: z.string().regex(/^[0-9+\-() ]+$/).max(15).optional(),
    address: z.string().max(200).optional(),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

/**
 * Leave Application Schema
 */
export const leaveApplicationSchema = z.object({
    type: z.number().int().positive('Leave type is required'),
    from_date: z.string().or(z.date()),
    to_date: z.string().or(z.date()),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
    contact_during_leave: z.string().max(15).optional(),
}).refine(
    (data) => new Date(data.to_date) >= new Date(data.from_date),
    { message: 'End date must be after or equal to start date', path: ['to_date'] }
);

export type LeaveApplicationInput = z.infer<typeof leaveApplicationSchema>;

/**
 * Employee Document Schema
 */
export const employeeDocumentSchema = z.object({
    id: z.number().optional(),
    document_master_id: z.number().int().positive(),
    document_number: z.string().min(2).max(100),
    upload_document: z.string().url('Invalid document URL').optional(),
    upload_name: z.string().max(200).optional(),
    start_date: z.string().or(z.date()).optional(),
    end_date: z.string().or(z.date()).optional(),
});

export type EmployeeDocumentInput = z.infer<typeof employeeDocumentSchema>;

/**
 * Pagination Schema
 */
export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Query parameter parsers
 */
export function parseQueryInt(value: string | null, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export function parseQueryBoolean(value: string | null): boolean {
    return value === 'true' || value === '1';
}

/**
 * Validate and parse request body
 */
export async function validateBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    const body = await request.json();
    return schema.parse(body);
}
