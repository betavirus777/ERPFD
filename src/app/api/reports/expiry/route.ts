import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiResponse, apiError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // Fetch all documents with an expiry date for ACTIVE employees only
        const documents = await prisma.employee_onboard_document.findMany({
            where: {
                end_date: { not: null },
                deleted_at: null,
                employee_onboarding: {
                    status: true, // Only active employees
                    deleted_at: null,
                    ...(search ? {
                        OR: [
                            { first_name: { contains: search } },
                            { last_name: { contains: search } },
                            { employee_code: { contains: search } },
                        ]
                    } : {})
                }
            },
            include: {
                employee_onboarding: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        employee_code: true,
                        uid: true,
                        employee_photo: true,
                        department: true,
                        status: true,
                        designation_master: {
                            select: { designation_name: true }
                        }
                    }
                },
                employee_document_master: {
                    select: {
                        document_type_name: true
                    }
                }
            },
            orderBy: {
                end_date: 'asc'
            },
            take: 500
        });

        // Process data to be UI friendly
        const processed = documents.map(doc => {
            const expiryDate = new Date(doc.end_date!);
            const today = new Date();
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let status = 'Valid';
            if (diffDays < 0) status = 'Expired';
            else if (diffDays <= 30) status = 'Expiring Soon (<30 Days)';
            else if (diffDays <= 60) status = 'Expiring Soon (<60 Days)';
            else if (diffDays <= 180) status = 'Expiring Soon (<6 Months)';

            return {
                id: doc.id,
                employeeName: `${doc.employee_onboarding.first_name} ${doc.employee_onboarding.last_name}`,
                employeeCode: doc.employee_onboarding.employee_code,
                designation: doc.employee_onboarding.designation_master?.designation_name,
                documentType: doc.employee_document_master?.document_type_name || 'Unknown',
                documentNumber: doc.document_number,
                expiryDate: doc.end_date,
                daysRemaining: diffDays,
                status
            };
        });

        return apiResponse(processed, HttpStatus.OK);
    } catch (error) {
        return apiError(error);
    }
}
