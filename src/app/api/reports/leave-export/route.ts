import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) throw APIError.unauthorized();

        const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.REPORTS_EXPORT);
        if (!hasAccess) throw APIError.forbidden('You do not have permission to export reports');

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || new Date().getFullYear().toString();

        // Fetch all leave applications with employee info
        const leaves = await prisma.applyLeave.findMany({
            where: {
                deleted_at: null,
                from_date: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`)
                }
            },
            orderBy: { from_date: 'desc' }
        });

        // Get employee details for each leave
        const employeeUids = [...new Set(leaves.map(l => l.employee_onboarding_id))];

        const employees = await prisma.employeeOnboarding.findMany({
            where: {
                uid: { in: employeeUids }
            },
            select: {
                uid: true,
                first_name: true,
                last_name: true,
                employee_code: true
            }
        });

        const employeeMap = new Map(employees.map(e => [e.uid, e]));

        // Get leave types
        const leaveTypes = await prisma.leaveMaster.findMany({
            where: { status: true, deleted_at: null }
        });
        const leaveTypeMap = new Map(leaveTypes.map(t => [t.id, t.leave_type]));

        // Get status names
        const statuses = await prisma.statusMaster.findMany({
            where: { module_master_id: 7 } // Leave module
        });
        const statusMap = new Map(statuses.map(s => [s.id, s.status_name]));

        // Format for export
        const exportData = leaves.map((leave, index) => {
            const emp = employeeMap.get(leave.employee_onboarding_id);
            return {
                'SI.No.': index + 1,
                'Employee ID': emp?.employee_code || leave.employee_onboarding_id,
                'Employee Name': emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
                'Start Date': leave.from_date ? new Date(leave.from_date).toLocaleDateString('en-GB') : '',
                'End Date': leave.to_date ? new Date(leave.to_date).toLocaleDateString('en-GB') : '',
                'Type of Leave': leaveTypeMap.get(leave.type || 0) || 'Unknown',
                'No. of Days': leave.number_of_days,
                'Year': year,
                'Status': statusMap.get(leave.status_master_id || 0) || 'Pending',
                'Reason': leave.description || ''
            };
        });

        // Also calculate leave balances per employee
        const balanceData: any[] = [];

        for (const emp of employees) {
            // Get allocations for this employee
            const allocations = await prisma.$queryRaw<any[]>`
        SELECT 
          la.leave_type_id,
          lm.leave_type,
          la.allocated_days,
          COALESCE(
            (SELECT SUM(al.number_of_days) 
             FROM apply_leave al 
             WHERE al.employee_onboarding_id = ${emp.uid}
             AND al.type = la.leave_type_id
             AND al.status_master_id = 2
             AND YEAR(al.from_date) = ${parseInt(year)}
             AND al.deleted_at IS NULL),
            0
          ) as used_days
        FROM leave_allocation la
        JOIN leave_master lm ON la.leave_type_id = lm.id
        WHERE la.employee_uid = ${emp.uid}
        AND la.year = ${parseInt(year)}
        AND la.status = 1
      `.catch(() => []);

            for (const alloc of allocations) {
                balanceData.push({
                    'Employee ID': emp.employee_code,
                    'Employee Name': `${emp.first_name} ${emp.last_name}`,
                    'Leave Type': alloc.leave_type,
                    'Year': year,
                    'Entitlement': alloc.allocated_days,
                    'Availed': alloc.used_days,
                    'Balance': alloc.allocated_days - alloc.used_days
                });
            }
        }

        return apiResponse({
            leaves: exportData,
            balances: balanceData,
            totalLeaves: exportData.length,
            totalEmployees: employees.length
        }, HttpStatus.OK);

    } catch (error) {
        console.error('Leave export error:', error);
        return apiError(error);
    }
}
