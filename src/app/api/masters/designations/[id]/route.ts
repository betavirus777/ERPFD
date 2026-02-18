import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';

// PUT update designation
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
            const { designation_name } = body;

            if (!designation_name) {
                return NextResponse.json(
                    { success: false, code: 400, error: 'Designation name is required' },
                    { status: 400 }
                );
            }

            const updatedDesignation = await prisma.designationMaster.update({
                where: { id: parseInt(id) },
                data: {
                    designation_name,
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                data: {
                    id: updatedDesignation.id,
                    designationName: updatedDesignation.designation_name,
                    status: updatedDesignation.status,
                },
                message: 'Designation updated successfully',
            });
        } catch (error: any) {
            console.error('Designation update error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to update designation' },
                { status: 500 }
            );
        }
    });
}

// DELETE designation (soft delete)
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

            await prisma.designationMaster.update({
                where: { id: parseInt(id) },
                data: {
                    deleted_at: new Date(),
                    status: false
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                message: 'Designation deleted successfully',
            });
        } catch (error: any) {
            console.error('Designation delete error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to delete designation' },
                { status: 500 }
            );
        }
    });
}

