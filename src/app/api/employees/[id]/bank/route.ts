import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Get bank details
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

    // Users can only view their own bank details unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own bank information' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update bank details
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

    // Check if bank details exist
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

