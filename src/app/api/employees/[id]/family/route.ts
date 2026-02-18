import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Relationship mapping for family info (stored as integer)
const RELATIONSHIP_MAP: Record<number, string> = {
  1: 'Father',
  2: 'Mother',
  3: 'Spouse',
  4: 'Sibling',
  5: 'Child',
  6: 'Son',
  7: 'Daughter',
  8: 'Brother',
  9: ' Sister',
  10: 'Friend',
  11: 'Other',
};

const RELATIONSHIP_REVERSE_MAP: Record<string, number> = {
  'Father': 1,
  'Mother': 2,
  'Spouse': 3,
  'Sibling': 4,
  'Child': 5,
  'Son': 6,
  'Daughter': 7,
  'Brother': 8,
  'Sister': 9,
  'Friend': 10,
  'Other': 11,
  'Parent': 1, // Alias
};

// Get family info
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

    // Users can only view their own family info unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own family information' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    const family = await prisma.employeeFamilyInfo.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: family.map((f: any) => ({
        id: f.id,
        name: f.name,
        relationship: RELATIONSHIP_MAP[f.relationship] || `Other (${f.relationship})`,
        relationship_id: f.relationship,
        dob: f.dob,
        contact_number: f.contact_number,
      })),
    });
  } catch (error: any) {
    console.error('Get family info error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update family member
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

    // Convert relationship string to number
    const relationshipId = typeof body.relationship === 'string'
      ? (RELATIONSHIP_REVERSE_MAP[body.relationship] || 11)
      : parseInt(body.relationship) || 11;

    if (body.id) {
      const family = await prisma.employeeFamilyInfo.update({
        where: { id: body.id },
        data: {
          name: body.name,
          relationship: relationshipId,
          dob: body.dob ? new Date(body.dob) : null,
          contact_number: body.contact_number,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...family,
          relationship: RELATIONSHIP_MAP[family.relationship || 11] || 'Other',
        },
        message: 'Family member updated successfully',
      });
    } else {
      const family = await prisma.employeeFamilyInfo.create({
        data: {
          employee_onboarding_id: employeeId,
          name: body.name,
          relationship: relationshipId,
          dob: body.dob ? new Date(body.dob) : null,
          contact_number: body.contact_number,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...family,
          relationship: RELATIONSHIP_MAP[family.relationship || 11] || 'Other',
        },
        message: 'Family member added successfully',
      });
    }
  } catch (error: any) {
    console.error('Save family member error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ success: false, error: 'Family ID required' }, { status: 400 });
    }

    await prisma.employeeFamilyInfo.update({
      where: { id: parseInt(familyId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Family member deleted successfully' });
  } catch (error: any) {
    console.error('Delete family member error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

