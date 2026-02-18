import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Get experience
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only view their own experience unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own work experience' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    const experience = await prisma.employeeExperience.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      orderBy: { start_date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: experience.map((e: any) => ({
        id: e.id,
        company_name: e.company_name,
        location: e.location,
        job_position: e.job_position,
        start_date: e.start_date,
        end_date: e.end_date,
      })),
    });
  } catch (error: any) {
    console.error('Get experience error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update experience
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    if (body.id) {
      const exp = await prisma.employeeExperience.update({
        where: { id: body.id },
        data: {
          company_name: body.company_name,
          location: body.location,
          job_position: body.job_position,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: exp, message: 'Experience updated successfully' });
    } else {
      const exp = await prisma.employeeExperience.create({
        data: {
          employee_onboarding_id: employeeId,
          company_name: body.company_name,
          location: body.location,
          job_position: body.job_position,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
        },
      });

      return NextResponse.json({ success: true, data: exp, message: 'Experience added successfully' });
    }
  } catch (error: any) {
    console.error('Save experience error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete experience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const expId = url.searchParams.get('expId');

    if (!expId) {
      return NextResponse.json({ success: false, error: 'Experience ID required' }, { status: 400 });
    }

    await prisma.employeeExperience.update({
      where: { id: parseInt(expId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Experience deleted successfully' });
  } catch (error: any) {
    console.error('Delete experience error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

