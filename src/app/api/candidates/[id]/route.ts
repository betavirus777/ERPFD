import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const GENDER_MAP: Record<number, string> = { 1: 'Male', 2: 'Female', 3: 'Other' };

// GET single candidate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidateId = parseInt(id);

    if (isNaN(candidateId)) {
      return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 400 });
    }

    const candidate = await prisma.potentialCandidate.findFirst({
      where: { id: candidateId, deleted_at: null },
      include: {
        country: { select: { country_name: true } },
        status_master: { select: { status: true } },
        potential_candidate_document: {
          where: { deleted_at: null },
          include: { employee_document_master: true },
        },
        potential_candidate_education: { where: { deleted_at: null } },
        potential_candidate_experience: { where: { deleted_at: null } },
      },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Get designation
    const designation = candidate.designation 
      ? await prisma.designationMaster.findUnique({ where: { id: candidate.designation }, select: { designation_name: true } })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        fullName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
        email: candidate.email,
        contactNumber: candidate.contact_number,
        gender: GENDER_MAP[candidate.gender || 0] || '-',
        genderId: candidate.gender,
        dob: candidate.dob,
        address: candidate.address,
        nationality: candidate.nationality,
        country: candidate.country?.country_name || '-',
        countryId: candidate.potential_country,
        designation: designation?.designation_name || '-',
        designationId: candidate.designation,
        engagementMethod: candidate.engagement_method,
        statusName: candidate.status_master?.status,
        statusMasterId: candidate.status_master_id,
        status: candidate.status,
        createdAt: candidate.created_at,
        documents: candidate.potential_candidate_document.map((d: any) => ({
          id: d.id,
          documentTypeName: d.employee_document_master?.document_type_name,
          documentMasterId: d.document_master_id,
          startDate: d.start_date,
          endDate: d.end_date,
          uploadDocument: d.upload_document,
        })),
        education: candidate.potential_candidate_education.map((e: any) => ({
          id: e.id,
          institution: e.institution,
          subject: e.subject,
          degree: e.degree,
          grade: e.grade,
          startDate: e.start_date,
          endDate: e.end_date,
        })),
        experience: candidate.potential_candidate_experience.map((e: any) => ({
          id: e.id,
          companyName: e.company_name,
          location: e.location,
          jobPosition: e.job_position,
          startDate: e.start_date,
          endDate: e.end_date,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update candidate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidateId = parseInt(id);
    const body = await request.json();

    if (isNaN(candidateId)) {
      return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 400 });
    }

    const existing = await prisma.potentialCandidate.findFirst({
      where: { id: candidateId, deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Check email uniqueness
    if (body.email && body.email !== existing.email) {
      const emailExists = await prisma.potentialCandidate.findFirst({
        where: { email: body.email, id: { not: candidateId }, deleted_at: null },
      });
      if (emailExists) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
      }
    }

    const updateData: any = { updated_at: new Date() };

    const fields = ['first_name', 'last_name', 'email', 'contact_number', 'address', 'nationality', 'engagement_method'];
    fields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f]; });

    if (body.gender !== undefined) updateData.gender = body.gender ? parseInt(body.gender) : null;
    if (body.dob !== undefined) updateData.dob = body.dob ? new Date(body.dob) : null;
    if (body.potential_country !== undefined) updateData.potential_country = body.potential_country ? parseInt(body.potential_country) : null;
    if (body.designation !== undefined) updateData.designation = body.designation ? parseInt(body.designation) : null;
    if (body.status_master_id !== undefined) updateData.status_master_id = body.status_master_id ? parseInt(body.status_master_id) : null;
    if (body.status !== undefined) updateData.status = Boolean(body.status);

    const candidate = await prisma.potentialCandidate.update({
      where: { id: candidateId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: candidate,
      message: 'Candidate updated successfully',
    });
  } catch (error: any) {
    console.error('Update candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Soft delete candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidateId = parseInt(id);

    if (isNaN(candidateId)) {
      return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 400 });
    }

    await prisma.potentialCandidate.update({
      where: { id: candidateId },
      data: { deleted_at: new Date(), status: false },
    });

    return NextResponse.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error: any) {
    console.error('Delete candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

