import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { apiError } from '@/lib/api-response';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

async function getSelfEmployeeId(employeeUid: string): Promise<number | null> {
  const emp = await prisma.employeeOnboarding.findFirst({ where: { uid: employeeUid, deleted_at: null }, select: { id: true } });
  return emp?.id ?? null;
}

// Get bank details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });

    // Only self or user with explicit permission to edit others
    const canManageOthers = await hasPermission(user, PERMISSIONS.EMPLOYEE_EDIT_OTHERS);
    if (!canManageOthers) {
      const selfId = await getSelfEmployeeId(user.employeeUid || '');
      if (selfId !== employeeId) {
        return NextResponse.json({ success: false, error: 'Forbidden - You can only view your own bank details' }, { status: 403 });
      }
    }

    const bankDetails = await prisma.employee_bank_details.findFirst({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
    });

    return NextResponse.json({
      success: true,
      data: bankDetails ? {
        id: bankDetails.id,
        bank_name: bankDetails.bank_name,
        bank_account_number: bankDetails.bank_account_number,
        recipient_name: bankDetails.recipient_name,
        bank_address: bankDetails.bank_address,
        bank_swift_code: bankDetails.bank_swift_code,
        bank_iban_number: bankDetails.bank_iban_number,
      } : null,
    });
  } catch (error: any) {
    console.error('Get bank details error:', error);
    return apiError(error);
  }
}

// Add/Update bank details — self or admin only
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });

    // Only self or user with explicit permission to edit others
    const canManageOthers = await hasPermission(user, PERMISSIONS.EMPLOYEE_EDIT_OTHERS);
    if (!canManageOthers) {
      const selfId = await getSelfEmployeeId(user.employeeUid || '');
      if (selfId !== employeeId) {
        return NextResponse.json({ success: false, error: 'Forbidden - You can only update your own bank details' }, { status: 403 });
      }
    }

    const body = await request.json();

    const existing = await prisma.employee_bank_details.findFirst({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
    });

    if (existing) {
      const bank = await prisma.employee_bank_details.update({
        where: { id: existing.id },
        data: {
          bank_name: body.bank_name,
          bank_account_number: body.bank_account_number,
          recipient_name: body.recipient_name,
          bank_address: body.bank_address,
          bank_swift_code: body.bank_swift_code,
          bank_iban_number: body.bank_iban_number,
          updated_at: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: bank, message: 'Bank details updated successfully' });
    } else {
      const bank = await prisma.employee_bank_details.create({
        data: {
          employee_onboarding_id: employeeId,
          bank_name: body.bank_name,
          bank_account_number: body.bank_account_number,
          recipient_name: body.recipient_name,
          bank_address: body.bank_address,
          bank_swift_code: body.bank_swift_code,
          bank_iban_number: body.bank_iban_number,
        },
      });
      return NextResponse.json({ success: true, data: bank, message: 'Bank details added successfully' });
    }
  } catch (error: any) {
    console.error('Save bank details error:', error);
    return apiError(error);
  }
}
