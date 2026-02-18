import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        if (!user) {
            throw APIError.unauthorized('User not authenticated');
        }

        // Fetch fresh data
        // Use employeeUid if available, otherwise try to find by other means if needed
        if (!user.employeeUid) {
            throw APIError.badRequest('User token missing employee reference');
        }

        const employee = await prisma.employeeOnboarding.findFirst({
            where: {
                uid: user.employeeUid,
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
            // If no employee record (admin only login?), return basic info
            return apiResponse({
                id: user.userId,
                email: user.email,
                user_id: user.employeeUid,
                roleId: user.roleId,
            }, HttpStatus.OK);
        }

        return apiResponse({
            id: user.userId, // Login table ID
            user_id: user.employeeUid, // UID
            email: user.email,
            firstName: employee.first_name,
            lastName: employee.last_name,
            employeeCode: employee.employee_code,
            employeePhoto: employee.employee_photo,
            employeeId: employee.id, // Crucial for My Profile
            roleId: employee.role_master_id,
            roleName: employee.role?.role_name,
            designationId: employee.designation_master_id,
            designationName: employee.designation_master?.designation_name,
            phoneNumber: employee.phone_number,
            doj: employee.doj,
            statusId: employee.status_master_id,
            statusName: employee.statusMaster?.status,
        }, HttpStatus.OK);

    } catch (error) {
        return apiError(error);
    }
}
