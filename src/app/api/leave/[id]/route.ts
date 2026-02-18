import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET single leave application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id);

    if (isNaN(leaveId)) {
      return NextResponse.json({ success: false, error: 'Invalid leave ID' }, { status: 400 });
    }

    const leave = await prisma.applyLeave.findFirst({
      where: { id: leaveId, deleted_at: null },
    });

    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    }

    // Get employee info
    const employee = await prisma.employeeOnboarding.findFirst({
      where: { uid: leave.employee_onboarding_id },
      include: { designation_master: true },
    });

    // Get leave type
    const leaveType = leave.type ? await prisma.leaveMaster.findUnique({ where: { id: leave.type } }) : null;

    return NextResponse.json({
      success: true,
      data: {
        id: leave.id,
        employeeId: leave.employee_onboarding_id,
        employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '-',
        employeeEmail: employee?.email,
        employeePhoto: employee?.employee_photo,
        designation: employee?.designation_master?.designation_name,
        leaveType: leaveType?.leave_type || '-',
        leaveTypeId: leave.type,
        fromDate: leave.from_date,
        toDate: leave.to_date,
        numberOfDays: leave.number_of_days,
        description: leave.description,
        statusId: leave.status_master_id,
        fileUpload: leave.file_upload,
        reasonOfCancellation: leave.reason_of_cancellation,
        createdAt: leave.created_at,
      },
    });
  } catch (error: any) {
    console.error('Get leave error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update leave application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id);
    const body = await request.json();

    if (isNaN(leaveId)) {
      return NextResponse.json({ success: false, error: 'Invalid leave ID' }, { status: 400 });
    }

    const existing = await prisma.applyLeave.findFirst({
      where: { id: leaveId, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    }

    // Only allow updates if status is pending
    if (existing.status_master_id !== 24) {
      return NextResponse.json({ success: false, error: 'Cannot update leave that is not pending' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.type !== undefined) updateData.type = parseInt(body.type);
    if (body.from_date) updateData.from_date = new Date(body.from_date);
    if (body.to_date) updateData.to_date = new Date(body.to_date);
    if (body.number_of_days) updateData.number_of_days = parseInt(body.number_of_days);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.file_upload !== undefined) updateData.file_upload = body.file_upload;

    const leave = await prisma.applyLeave.update({
      where: { id: leaveId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application updated successfully',
    });
  } catch (error: any) {
    console.error('Update leave error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id);

    if (isNaN(leaveId)) {
      return NextResponse.json({ success: false, error: 'Invalid leave ID' }, { status: 400 });
    }

    const existing = await prisma.applyLeave.findFirst({
      where: { id: leaveId, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.applyLeave.update({
      where: { id: leaveId },
      data: {
        deleted_at: new Date(),
        status: false,
        status_master_id: 27, // Cancelled
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Leave application cancelled successfully',
    });
  } catch (error: any) {
    console.error('Delete leave error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

