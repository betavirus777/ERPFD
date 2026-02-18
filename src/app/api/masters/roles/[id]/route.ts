import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';

// PUT update role
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
            const { role_name } = body;

            if (!role_name) {
                return NextResponse.json(
                    { success: false, code: 400, error: 'Role name is required' },
                    { status: 400 }
                );
            }

            const updatedRole = await prisma.roleMaster.update({
                where: { id: parseInt(id) },
                data: {
                    role_name,
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                data: {
                    id: updatedRole.id,
                    roleName: updatedRole.role_name,
                    roleDescription: updatedRole.role_description,
                    status: updatedRole.status_master_id,
                },
                message: 'Role updated successfully',
            });
        } catch (error: any) {
            console.error('Role update error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to update role' },
                { status: 500 }
            );
        }
    });
}

// DELETE role (soft delete)
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

            await prisma.roleMaster.update({
                where: { id: parseInt(id) },
                data: {
                    deleted_at: new Date(),
                    status_master_id: false
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                message: 'Role deleted successfully',
            });
        } catch (error: any) {
            console.error('Role delete error:', error);
            return NextResponse.json(
                { success: false, code: 500, error: error.message || 'Failed to delete role' },
                { status: 500 }
            );
        }
    });
}

