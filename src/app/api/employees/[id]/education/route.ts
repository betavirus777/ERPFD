import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Get education
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

    // Users can only view their own education unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own education history' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    const education = await prisma.employeeEducationDetail.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      orderBy: { start_date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: education.map((e: any) => ({
        id: e.id,
        institution: e.institution,
        subject: e.subject,
        degree: e.degree,
        grade: e.grade,
        start_date: e.start_date,
        end_date: e.end_date,
      })),
    });
  } catch (error: any) {
    console.error('Get education error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update education
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
      const edu = await prisma.employeeEducationDetail.update({
        where: { id: body.id },
        data: {
          institution: body.institution,
          subject: body.subject,
          degree: body.degree,
          grade: body.grade,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: edu, message: 'Education updated successfully' });
    } else {
      const edu = await prisma.employeeEducationDetail.create({
        data: {
          employee_onboarding_id: employeeId,
          institution: body.institution,
          subject: body.subject,
          degree: body.degree,
          grade: body.grade,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
        },
      });

      return NextResponse.json({ success: true, data: edu, message: 'Education added successfully' });
    }
  } catch (error: any) {
    console.error('Save education error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete education
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const eduId = url.searchParams.get('eduId');

    if (!eduId) {
      return NextResponse.json({ success: false, error: 'Education ID required' }, { status: 400 });
    }

    await prisma.employeeEducationDetail.update({
      where: { id: parseInt(eduId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Education deleted successfully' });
  } catch (error: any) {
    console.error('Delete education error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

