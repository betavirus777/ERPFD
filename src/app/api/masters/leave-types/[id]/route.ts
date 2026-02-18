import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';

// PUT update leave type
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (user) => {
        try {
            const { id } = await context.params
            const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_EDIT)

            if (!hasAccess) {
                return NextResponse.json(
                    { success: false, code: 403, error: 'Forbidden' },
                    { status: 403 }
                )
            }

            const body = await request.json();
            const { leave_type } = body;

            if (!leave_type) {
                return NextResponse.json(
                    { success: false, code: 400, error: 'Leave type name is required' },
                    { status: 400 }
                );
            }

            const updated = await prisma.leaveMaster.update({
                where: { id: parseInt(id) },
                data: {
                    leave_type,
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                data: {
                    id: updated.id,
                    leaveType: updated.leave_type,
                    description: updated.leave_description,
                    maxLeaveCount: updated.max_leave_count,
                    status: updated.status,
                },
                message: 'Leave type updated successfully',
            });
        } catch (error: any) {
            console.error('Leave type update error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to update leave type' },
                { status: 500 }
            );
        }
    });
}

// DELETE leave type (soft delete)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (user) => {
        try {
            const { id } = await context.params
            const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_DELETE)

            if (!hasAccess) {
                return NextResponse.json(
                    { success: false, code: 403, error: 'Forbidden' },
                    { status: 403 }
                )
            }

            await prisma.leaveMaster.update({
                where: { id: parseInt(id) },
                data: {
                    deleted_at: new Date(),
                    status: false
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                message: 'Leave type deleted successfully',
            });
        } catch (error: any) {
            console.error('Leave type delete error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to delete leave type' },
                { status: 500 }
            );
        }
    });
}

