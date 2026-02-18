import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';
import { APIError } from '@/lib/api-response';

// Get all permissions grouped by module
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    // Only Super Admin and HR can view permissions
    if (user.roleId !== ROLES.SUPER_ADMIN && user.roleId !== ROLES.HR) {
      throw APIError.forbidden('You do not have permission to view permissions');
    }

    const permissions = await prisma.permission.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        module_master: true
      },
      orderBy: [
        { module_id: 'asc' },
        { id: 'asc' }
      ]
    });

    // Group permissions by module
    const groupedPermissions: Record<string, any[]> = {};

    permissions.forEach(perm => {
      const moduleName = perm.module_master?.module_name || 'Other';
      if (!groupedPermissions[moduleName]) {
        groupedPermissions[moduleName] = [];
      }
      groupedPermissions[moduleName].push({
        id: perm.id,
        name: perm.description,
        moduleId: perm.module_id,
        moduleName: moduleName,
      });
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: groupedPermissions
    });

  } catch (error: any) {
    console.error('Permissions fetch error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
