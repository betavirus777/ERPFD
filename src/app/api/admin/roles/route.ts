import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';
import { APIError } from '@/lib/api-response';

// Get all roles with permission count
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    // Only Super Admin and HR can view roles configuration
    if (user.roleId !== ROLES.SUPER_ADMIN && user.roleId !== ROLES.HR) {
      throw APIError.forbidden('You do not have permission to manage roles');
    }

    const roles = await prisma.roleMaster.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        _count: {
          select: {
            permissions: {
              where: { status: true }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: roles.map(role => ({
        id: role.id,
        name: role.role_name,
        description: role.role_description,
        permissionCount: role._count.permissions,
        status: role.status_master_id
      }))
    });

  } catch (error: any) {
    console.error('Roles fetch error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
