import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions';

// GET - List leave types
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

      const leaveTypes = await prisma.leaveMaster.findMany({
        where: { status: true, deleted_at: null },
        orderBy: { leave_type: 'asc' },
      });

      const response = NextResponse.json({
        success: true,
        code: 200,
        data: leaveTypes.map(lt => ({
          id: lt.id,
          leaveType: lt.leave_type,
          description: lt.leave_description,
          maxLeaveCount: lt.max_leave_count,
          status: lt.status,
        })),
      });

      // Cache for 5 minutes - master data doesn't change frequently
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
      return response;
    } catch (error) {
      console.error('Get leave types error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// POST - Add leave type
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

      const data = await request.json();

      const leaveType = await prisma.leaveMaster.create({
        data: {
          leave_type: data.leave_type || data.leaveType,
          leave_description: data.leave_description || data.description,
          max_leave_count: data.max_leave_count || data.maxLeaveCount || 0,
          status: true,
        },
      });

      return NextResponse.json({
        success: true,
        code: 200,
        data: leaveType,
        message: 'Leave type added successfully',
      });
    } catch (error) {
      console.error('Add leave type error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

