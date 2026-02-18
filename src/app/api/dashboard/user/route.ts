import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) throw APIError.unauthorized();

        const employeeUid = user.employeeUid;
        if (!employeeUid) {
            return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentYear = today.getFullYear();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        // Get employee details
        const employee = await prisma.employeeOnboarding.findFirst({
            where: { uid: employeeUid },
            include: {
                designation_master: true,
                role: true
            }
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
        }

        // Get leave allocations for this year
        const allocations = await prisma.$queryRaw<any[]>`
      SELECT 
        la.leave_type_id,
        lm.leave_type,
        la.allocated_days,
        COALESCE(
          (SELECT SUM(al.number_of_days) 
           FROM apply_leave al 
           WHERE al.employee_onboarding_id = ${employeeUid}
           AND al.type = la.leave_type_id
           AND al.status_master_id = 2
           AND YEAR(al.from_date) = ${currentYear}
           AND al.deleted_at IS NULL),
          0
        ) as used_days
      FROM leave_allocation la
      JOIN leave_master lm ON la.leave_type_id = lm.id
      WHERE la.employee_uid = ${employeeUid}
      AND la.year = ${currentYear}
      AND la.status = 1
    `.catch(() => []);

        // Pending leave requests
        const pendingLeaves = await prisma.applyLeave.count({
            where: {
                employee_onboarding_id: employeeUid,
                status_master_id: 1, // Pending
                deleted_at: null
            }
        }).catch(() => 0);

        // Approved leaves this year
        const approvedLeavesCount = await prisma.applyLeave.count({
            where: {
                employee_onboarding_id: employeeUid,
                status_master_id: 2, // Approved
                deleted_at: null,
                from_date: {
                    gte: new Date(`${currentYear}-01-01`),
                    lte: new Date(`${currentYear}-12-31`)
                }
            }
        }).catch(() => 0);

        // Upcoming leaves
        const upcomingLeaves = await prisma.applyLeave.findMany({
            where: {
                employee_onboarding_id: employeeUid,
                status_master_id: 2, // Approved
                from_date: { gte: today },
                deleted_at: null
            },
            orderBy: { from_date: 'asc' },
            take: 5
        }).catch(() => []);

        // Get leave types
        const leaveTypes = await prisma.leaveMaster.findMany({ where: { status: true } });
        const leaveTypeMap = new Map(leaveTypes.map(t => [t.id, t.leave_type]));

        // My expiring documents
        const myExpiringDocs = await prisma.employee_onboard_document.findMany({
            where: {
                employee_onboarding_id: employee.id,
                deleted_at: null,
                end_date: {
                    gte: today,
                    lte: sixMonthsFromNow
                }
            },
            include: {
                employee_document_master: {
                    select: { document_type_name: true }
                }
            },
            orderBy: { end_date: 'asc' },
            take: 10
        });

        // My document requests
        const myDocRequests = await prisma.documentRequest.findMany({
            where: {
                employee_id: employee.id,
            },
            orderBy: { created_at: 'desc' },
            take: 5
        }).catch(() => []);

        // Calculate total leave balance
        const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.allocated_days || 0), 0);
        const totalUsed = allocations.reduce((sum: number, a: any) => sum + (Number(a.used_days) || 0), 0);
        const totalBalance = totalAllocated - totalUsed;

        return NextResponse.json({
            success: true,
            data: {
                employee: {
                    name: `${employee.first_name} ${employee.last_name}`,
                    code: employee.employee_code,
                    designation: employee.designation_master?.designation_name,
                    role: employee.role?.role_name,
                    photo: employee.employee_photo,
                    doj: employee.doj
                },
                leaveStats: {
                    totalAllocated,
                    totalUsed,
                    totalBalance,
                    pendingLeaves,
                    approvedLeavesCount,
                    allocations: allocations.map((a: any) => ({
                        leaveType: a.leave_type,
                        allocated: a.allocated_days,
                        used: Number(a.used_days),
                        balance: a.allocated_days - Number(a.used_days)
                    }))
                },
                upcomingLeaves: upcomingLeaves.map((l: any) => ({
                    id: l.id,
                    fromDate: l.from_date,
                    toDate: l.to_date,
                    days: l.number_of_days,
                    leaveType: leaveTypeMap.get(l.type) || 'Leave'
                })),
                expiringDocuments: myExpiringDocs.map(doc => ({
                    id: doc.id,
                    documentType: doc.employee_document_master?.document_type_name,
                    documentNumber: doc.document_number,
                    expiryDate: doc.end_date,
                    daysToExpiry: doc.end_date ? Math.ceil((new Date(doc.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
                })),
                documentRequests: myDocRequests.map((r: any) => ({
                    id: r.id,
                    documentType: r.document_type,
                    status: r.status,
                    createdAt: r.created_at
                }))
            }
        });

    } catch (error: any) {
        console.error('User Dashboard Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
