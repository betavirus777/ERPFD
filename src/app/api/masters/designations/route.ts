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
        where.status = status === '1' || status === 'true';
      }

      const designations = await prisma.designationMaster.findMany({
        where,
        select: {
          id: true,
          designation_name: true,
          status: true,
        },
        orderBy: { designation_name: 'asc' },
      });

      return NextResponse.json({
        success: true,
        code: 200,
        data: designations.map((d: any) => ({
          id: d.id,
          designationName: d.designation_name,
          status: d.status,
        })),
      });
    } catch (error: any) {
      console.error('Designations fetch error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: error.message || 'Failed to fetch designations' },
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
      const { designation_name } = body;

      if (!designation_name) {
        return NextResponse.json(
          { success: false, code: 400, error: 'Designation name is required' },
          { status: 400 }
        );
      }

      const newDesignation = await prisma.designationMaster.create({
        data: {
          designation_name,
          status_master_id: 1,
          status: true,
        },
      });

      return NextResponse.json({
        success: true,
        code: 201,
        data: {
          id: newDesignation.id,
          designationName: newDesignation.designation_name,
          status: newDesignation.status,
        },
        message: 'Designation created successfully',
      });
    } catch (error: any) {
      console.error('Designation creation error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: error.message || 'Failed to create designation' },
        { status: 500 }
      );
    }
  });
}

