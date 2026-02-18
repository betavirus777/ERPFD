import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Get salary details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only view their own salary unless they're admin/HR
    // For now, we'll check if the requested ID matches the logged-in user's ID
    if (id !== user.employeeUid && !user.roleId) {
      // TODO: Add proper role check (roleId === ADMIN_ROLE_ID || roleId === HR_ROLE_ID)
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own salary information' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    // Get salary details
    const salaryDetails = await prisma.employeeSalaryDetails.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    // Get allowance types and countries for mapping
    const [allowanceTypes, countries] = await Promise.all([
      prisma.allowance_type_master.findMany({ where: { allowance_deleted_at: null } }),
      prisma.countryMaster.findMany({ where: { status: true } }),
    ]);

    const allowanceMap = new Map(allowanceTypes.map((at: any) => [at.id, at.allowance_type]));
    const countryMap = new Map(countries.map((c: any) => [c.id, c.country_currency || c.country_name]));

    return NextResponse.json({
      success: true,
      data: salaryDetails.map((s: any) => ({
        id: s.id,
        allowance_type_id: s.allowance_type_id,
        allowanceTypeName: allowanceMap.get(s.allowance_type_id) || '-',
        allowance_amount: s.allowance_type_salary_amount,
        allowance_currency: s.allowance_type_currency,
        allowance_currency_name: countryMap.get(s.allowance_type_currency) || '-',
      })),
    });
  } catch (error: any) {
    console.error('Get salary details error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update salary detail
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

    // Get allowance type and currency info for response
    const [allowanceType, currency] = await Promise.all([
      prisma.allowance_type_master.findUnique({ where: { id: parseInt(body.allowance_type_id) } }),
      body.allowance_currency ? prisma.countryMaster.findUnique({ where: { id: parseInt(body.allowance_currency) } }) : null,
    ]);

    if (body.id) {
      const salary = await prisma.employeeSalaryDetails.update({
        where: { id: body.id },
        data: {
          allowance_type_id: parseInt(body.allowance_type_id),
          allowance_type_salary_amount: parseFloat(body.allowance_amount) || 0,
          allowance_type_currency: body.allowance_currency ? parseInt(body.allowance_currency) : null,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: salary.id,
          allowance_type_id: salary.allowance_type_id,
          allowanceTypeName: allowanceType?.allowance_type || '-',
          allowance_amount: salary.allowance_type_salary_amount,
          allowance_currency: salary.allowance_type_currency,
          allowance_currency_name: currency?.country_currency || '-',
        },
        message: 'Salary detail updated successfully',
      });
    } else {
      const salary = await prisma.employeeSalaryDetails.create({
        data: {
          employee_onboarding_id: employeeId,
          allowance_type_id: parseInt(body.allowance_type_id),
          allowance_type_salary_amount: parseFloat(body.allowance_amount) || 0,
          allowance_type_currency: body.allowance_currency ? parseInt(body.allowance_currency) : null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: salary.id,
          allowance_type_id: salary.allowance_type_id,
          allowanceTypeName: allowanceType?.allowance_type || '-',
          allowance_amount: salary.allowance_type_salary_amount,
          allowance_currency: salary.allowance_type_currency,
          allowance_currency_name: currency?.country_currency || '-',
        },
        message: 'Salary detail added successfully',
      });
    }
  } catch (error: any) {
    console.error('Save salary detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete salary detail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const salaryId = url.searchParams.get('salaryId');

    if (!salaryId) {
      return NextResponse.json({ success: false, error: 'Salary ID required' }, { status: 400 });
    }

    await prisma.employeeSalaryDetails.update({
      where: { id: parseInt(salaryId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Salary detail deleted successfully' });
  } catch (error: any) {
    console.error('Delete salary detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

