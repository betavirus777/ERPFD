import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

// Leave status mapping
const STATUS_MAP: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  4: 'Rejected',
  26: 'Request For Cancellation',
  27: 'Cancelled',
};

// GET all leave applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const employee_id = searchParams.get('employee_id') || '';
    const leave_type = searchParams.get('leave_type') || '';
    const personal = searchParams.get('personal') === 'true'; // Flag to indicate "my leave"

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      status: true,
    };

    if (status) {
      where.status_master_id = parseInt(status);
    }

    // For "My Leave" - extract user ID from session token
    if (personal) {
      const user = await getUserFromRequest(request);
      if (!user?.employeeUid) {
        throw APIError.unauthorized();
      }
      where.employee_onboarding_id = user.employeeUid;
    } else {
      // For/admin view - Check permissions
      const user = await getUserFromRequest(request);
      if (!user) throw APIError.unauthorized();

      if (!(await hasPermission(user, PERMISSIONS.LEAVE_VIEW))) {
        throw APIError.forbidden('You do not have permission to view all leaves');
      }

      // For admin view - allow filtering by specific employee
      if (employee_id && employee_id.trim()) {
        where.employee_onboarding_id = employee_id;
      }
    }

    if (leave_type && leave_type.trim()) {
      where.type = parseInt(leave_type);
    }

    // Base where clause without status filter for total counts
    const baseWhere = {
      deleted_at: null,
      status: true,
      ...(employee_id && employee_id.trim() ? { employee_onboarding_id: employee_id } : {}),
      ...(leave_type && leave_type.trim() ? { type: parseInt(leave_type) } : {}),
    };

    // Get leave applications with employee info
    const [leaveApplications, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.applyLeave.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.applyLeave.count({ where: baseWhere }),
      prisma.applyLeave.count({ where: { ...baseWhere, status_master_id: 1 } }),
      prisma.applyLeave.count({ where: { ...baseWhere, status_master_id: 2 } }),
      prisma.applyLeave.count({ where: { ...baseWhere, status_master_id: 4 } }),
    ]);

    // Get employee and leave type info
    const employeeIds = [...new Set(leaveApplications.map((l: any) => l.employee_onboarding_id))];
    const leaveTypeIds = [...new Set(leaveApplications.map((l: any) => l.type).filter(Boolean))];

    const [employees, leaveTypes] = await Promise.all([
      prisma.employeeOnboarding.findMany({
        where: { uid: { in: employeeIds } },
        select: {
          uid: true,
          first_name: true,
          last_name: true,
          employee_photo: true,
          employee_code: true,
          designation_master: { select: { designation_name: true } }
        },
      }),
      prisma.leaveMaster.findMany({
        where: { id: { in: leaveTypeIds as number[] } },
        select: { id: true, leave_type: true },
      }),
    ]);

    const employeeMap = new Map(employees.map((e: any) => [e.uid, e]));
    const leaveTypeMap = new Map(leaveTypes.map((lt: any) => [lt.id, lt.leave_type]));

    const data = leaveApplications.map((leave: any) => {
      const emp = employeeMap.get(leave.employee_onboarding_id);
      return {
        id: leave.id,
        employeeId: leave.employee_onboarding_id,
        employeeName: emp ? `${emp.first_name} ${emp.last_name}` : '-',
        employeeCode: emp?.employee_code || '-',
        employeePhoto: emp?.employee_photo,
        designation: emp?.designation_master?.designation_name || '-',
        leaveType: leaveTypeMap.get(leave.type) || '-',
        leaveTypeId: leave.type,
        fromDate: leave.from_date,
        toDate: leave.to_date,
        numberOfDays: leave.number_of_days,
        description: leave.description,
        statusId: leave.status_master_id,
        statusName: STATUS_MAP[leave.status_master_id || 1] || 'Pending',
        fileUpload: leave.file_upload,
        reasonOfCancellation: leave.reason_of_cancellation,
        createdAt: leave.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error: any) {
    console.error('Get leave applications error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch leave applications' },
      { status: 500 }
    );
  }
}

// POST - Apply for leave
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.employeeUid) {
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.LEAVE_APPLY))) {
      throw APIError.forbidden('You do not have permission to apply for leave');
    }

    const body = await request.json();

    const {
      leaveTypeId,
      fromDate,
      toDate,
      numberOfDays, // Matching UI payload
      noOfDays, // Fallback
      reason,
      fileUpload,
    } = body;

    const days = numberOfDays || noOfDays;

    if (!leaveTypeId || !fromDate || !toDate || !days) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for overlapping leaves
    const existingLeave = await prisma.applyLeave.findFirst({
      where: {
        employee_onboarding_id: user.employeeUid,
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

    const leave = await prisma.applyLeave.create({
      data: {
        employee_onboarding_id: user.employeeUid,
        type: parseInt(leaveTypeId),
        from_date: new Date(fromDate),
        to_date: new Date(toDate),
        number_of_days: parseInt(days),
        description: reason,
        file_upload: fileUpload || null,
        status_master_id: 1, // Pending
        status: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: leave,
      message: 'Leave application submitted successfully',
    });
  } catch (error: any) {
    console.error('Apply leave error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to submit leave application' },
      { status: 500 }
    );
  }
}
