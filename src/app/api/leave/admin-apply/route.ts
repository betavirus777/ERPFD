import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

// POST - Admin apply leave on behalf of employee
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.LEAVE_APPROVE))) {
      throw APIError.forbidden('You do not have permission to manage leaves');
    }

    const body = await request.json();

    const {
      employeeUid,
      leaveTypeId,
      fromDate,
      toDate,
      noOfDays,
      reason,
      fileUpload,
    } = body;

    if (!employeeUid || !leaveTypeId || !fromDate || !toDate || !noOfDays || !reason) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.employeeOnboarding.findFirst({
      where: {
        uid: employeeUid,
        deleted_at: null,
        status: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check leave type exists
    const leaveType = await prisma.leaveMaster.findUnique({
      where: { id: parseInt(leaveTypeId) },
    });

    if (!leaveType) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Leave type not found' },
        { status: 404 }
      );
    }

    // Check for overlapping leaves
    const existingLeave = await prisma.applyLeave.findFirst({
      where: {
        employee_onboarding_id: employeeUid,
        deleted_at: null,
        status: true,
        status_master_id: { in: [1, 2] }, // Pending or Approved
        OR: [
          {
            AND: [
              { from_date: { lte: new Date(toDate) } },
              { to_date: { gte: new Date(fromDate) } },
            ],
          },
        ],
      },
    });

    if (existingLeave) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Leave dates overlap with an existing leave application' },
        { status: 400 }
      );
    }

    // Create leave application - auto-approved when admin applies
    const leave = await prisma.applyLeave.create({
      data: {
        employee_onboarding_id: employeeUid,
        type: parseInt(leaveTypeId),
        from_date: new Date(fromDate),
        to_date: new Date(toDate),
        number_of_days: parseInt(noOfDays),
        description: reason,
        file_upload: fileUpload || null,
        status_master_id: 2, // Approved (auto-approved by admin)
        status: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: leave,
      message: `Leave applied successfully for ${employee.first_name} ${employee.last_name}`,
    });
  } catch (error: any) {
    console.error('Admin apply leave error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to apply leave' },
      { status: 500 }
    );
  }
}
