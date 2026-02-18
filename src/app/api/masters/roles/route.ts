import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_VIEW)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, code: 403, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      const where: any = { deleted_at: null };

      if (status !== null && status !== '') {
        where.status_master_id = status === '1' || status === 'true';
      }

      const roles = await prisma.roleMaster.findMany({
        where,
        select: {
          id: true,
          role_name: true,
          role_description: true,
          status_master_id: true,
        },
        orderBy: { role_name: 'asc' },
      });

      return NextResponse.json({
        success: true,
        code: 200,
        data: roles.map(r => ({
          id: r.id,
          roleName: r.role_name,
          roleDescription: r.role_description,
          status: r.status_master_id,
        })),
      });
    } catch (error: any) {
      console.error('Roles fetch error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: error.message || 'Failed to fetch roles' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_CREATE)

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

      const newRole = await prisma.roleMaster.create({
        data: {
          role_name,
          status_master_id: true,
        },
      });

      return NextResponse.json({
        success: true,
        code: 201,
        data: {
          id: newRole.id,
          roleName: newRole.role_name,
          roleDescription: newRole.role_description,
          status: newRole.status_master_id,
        },
        message: 'Role created successfully',
      });
    } catch (error: any) {
      console.error('Role creation error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: error.message || 'Failed to create role' },
        { status: 500 }
      );
    }
  });
}

