import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Get emergency contacts
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

    // Users can only view their own emergency contacts unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own emergency contacts' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    const contacts = await prisma.employeeEmergencyContact.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: contacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship, // Already a string in this table
        contact_number: c.contact_number,
      })),
    });
  } catch (error: any) {
    console.error('Get emergency contacts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update emergency contact
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
      const contact = await prisma.employeeEmergencyContact.update({
        where: { id: body.id },
        data: {
          name: body.name,
          relationship: body.relationship,
          contact_number: body.contact_number,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: contact,
        message: 'Contact updated successfully',
      });
    } else {
      const contact = await prisma.employeeEmergencyContact.create({
        data: {
          employee_onboarding_id: employeeId,
          name: body.name,
          relationship: body.relationship,
          contact_number: body.contact_number,
        },
      });

      return NextResponse.json({
        success: true,
        data: contact,
        message: 'Contact added successfully',
      });
    }
  } catch (error: any) {
    console.error('Save contact error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Contact ID required' }, { status: 400 });
    }

    await prisma.employeeEmergencyContact.update({
      where: { id: parseInt(contactId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

