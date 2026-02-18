import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';
import { APIError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Get permissions for a specific role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    if (user.roleId !== ROLES.SUPER_ADMIN && user.roleId !== ROLES.HR) {
      throw APIError.forbidden('You do not have permission to view role permissions');
    }

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
        return NextResponse.json(
          { success: false, code: 400, error: 'Invalid role ID' },
          { status: 400 }
        );
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role_id: roleId,
        status: true,
      },
      select: {
        permission_id: true,
      }
    });

    const permissionIds = rolePermissions.map(rp => rp.permission_id);

    return NextResponse.json({
      success: true,
      code: 200,
      data: permissionIds
    });

  } catch (error: any) {
    console.error('Role permissions fetch error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch role permissions' },
      { status: 500 }
    );
  }
}

// Update permissions for a specific role
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
      const user = await getUserFromRequest(request);
      if (!user) {
        throw APIError.unauthorized();
      }
  
      // Only Super Admin can update permissions
      if (user.roleId !== ROLES.SUPER_ADMIN) {
        throw APIError.forbidden('Only Super Admin can update role permissions');
      }
  
      const { id } = await params;
      const roleId = parseInt(id);
  
      if (isNaN(roleId)) {
          return NextResponse.json(
            { success: false, code: 400, error: 'Invalid role ID' },
            { status: 400 }
          );
      }

      // Prevent modifying Super Admin permissions (always has all)
      if (roleId === ROLES.SUPER_ADMIN) {
        return NextResponse.json(
            { success: false, code: 400, error: 'Cannot modify Super Admin permissions' },
            { status: 400 }
          );
      }
  
      const body = await request.json();
      const { permissionIds } = body; // Array of permission IDs
  
      if (!Array.isArray(permissionIds)) {
        return NextResponse.json(
          { success: false, code: 400, error: 'permissionIds must be an array' },
          { status: 400 }
        );
      }
  
      // Transaction: 
      // 1. Disable existing permissions (soft delete or set status false)
      // 2. Enable/Create specified permissions
      
      // Simpler approach for this task: Delete existing mapped permissions and create new ones
      // OR: Update status=false for all, then update status=true for selected
      
      await prisma.$transaction(async (tx) => {
        // 1. Disable all permissions for this role
        await tx.rolePermission.updateMany({
            where: { role_id: roleId },
            data: { status: false, updated_at: new Date(), updated_by: user.employeeUid }
        });

        // 2. For each permissionId, check if it exists, if so update/enable, else create
        // Upsert is tricky with many-to-many, so we'll check existence first or just simple create loop
        
        // Better: Find existing RolePermission records for this role
        const existingRecs = await tx.rolePermission.findMany({
            where: { role_id: roleId },
            select: { id: true, permission_id: true }
        });
        
        const existingPermIds = new Set(existingRecs.map(r => r.permission_id));
        
        // Operations
        const toCreate = [];
        const toUpdateIds = [];

        for (const permId of permissionIds) {
            if (existingPermIds.has(permId)) {
                // Determine the ID of the RolePermission record to update
                 const rec = existingRecs.find(r => r.permission_id === permId);
                 if(rec) toUpdateIds.push(rec.id);
            } else {
                toCreate.push(permId);
            }
        }

        // Batch update
        if (toUpdateIds.length > 0) {
            await tx.rolePermission.updateMany({
                where: { id: { in: toUpdateIds } },
                data: { status: true, updated_at: new Date(), updated_by: user.employeeUid }
            });
        }

        // Batch create
        if (toCreate.length > 0) {
            await tx.rolePermission.createMany({
                data: toCreate.map(permId => ({
                    role_id: roleId,
                    permission_id: permId,
                    organization_id: user.organizationId, 
                    status: true,
                    created_by: user.employeeUid,
                    updated_by: user.employeeUid
                }))
            });
        }

      });
  
      return NextResponse.json({
        success: true,
        code: 200,
        message: 'Permissions updated successfully'
      });
  
    } catch (error: any) {
      console.error('Role permissions update error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: error.message || 'Failed to update role permissions' },
        { status: 500 }
      );
    }
  }
