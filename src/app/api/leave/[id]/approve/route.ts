import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Leave status IDs
const STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 4,
  REQUEST_CANCELLATION: 26,
  CANCELLED: 27,
};

// POST - Approve, Reject, or Process cancellation
export async function POST(
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

    const { type, reason } = body;

    // type: 1 = Approve, 0 = Reject, 3 = Request Cancellation, 4 = Approve Cancellation

    const existing = await prisma.applyLeave.findFirst({
      where: { id: leaveId, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    }

    let newStatusId: number;
    let message: string;
    const updateData: any = { updated_at: new Date() };

    switch (type) {
      case 1: // Approve leave
        if (existing.status_master_id !== STATUS.PENDING) {
          return NextResponse.json(
            { success: false, error: 'Only pending leaves can be approved' },
            { status: 400 }
          );
        }
        newStatusId = STATUS.APPROVED;
        message = 'Leave approved successfully';
        break;

      case 0: // Reject leave
        if (existing.status_master_id !== STATUS.PENDING) {
          return NextResponse.json(
            { success: false, error: 'Only pending leaves can be rejected' },
            { status: 400 }
          );
        }
        newStatusId = STATUS.REJECTED;
        message = 'Leave rejected';
        break;

      case 3: // Request cancellation (by employee)
        if (existing.status_master_id !== STATUS.APPROVED) {
          return NextResponse.json(
            { success: false, error: 'Only approved leaves can be requested for cancellation' },
            { status: 400 }
          );
        }
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'Cancellation reason is required' },
            { status: 400 }
          );
        }
        newStatusId = STATUS.REQUEST_CANCELLATION;
        updateData.reason_of_cancellation = reason;
        message = 'Cancellation request submitted';
        break;

      case 4: // Approve cancellation (by admin)
        if (existing.status_master_id !== STATUS.REQUEST_CANCELLATION) {
          return NextResponse.json(
            { success: false, error: 'Only cancellation requests can be approved' },
            { status: 400 }
          );
        }
        newStatusId = STATUS.CANCELLED;
        updateData.status = false; // Soft disable
        message = 'Leave cancelled successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action type' },
          { status: 400 }
        );
    }

    updateData.status_master_id = newStatusId;

    const leave = await prisma.applyLeave.update({
      where: { id: leaveId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: leave,
      message,
    });
  } catch (error: any) {
    console.error('Process leave error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
