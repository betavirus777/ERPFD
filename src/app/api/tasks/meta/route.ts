import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiResponse, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const [statuses, priorities, employees] = await Promise.all([
            prisma.taskStatus.findMany({
                where: { status: true },
                orderBy: { order: 'asc' }
            }),
            prisma.taskPriority.findMany({
                where: { status: true },
                orderBy: { order: 'asc' }
            }),
            prisma.employeeOnboarding.findMany({
                where: { status: true, deleted_at: null },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    employee_photo: true
                },
                orderBy: { first_name: 'asc' }
            })
        ]);

        return apiResponse({ statuses, priorities, employees });
    } catch (error) {
        return apiError(error);
    }
}
