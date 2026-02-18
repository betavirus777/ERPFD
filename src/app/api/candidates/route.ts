import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

const GENDER_MAP: Record<number, string> = { 1: 'Male', 2: 'Female', 3: 'Other' };
const ENGAGEMENT_MAP: Record<string, string> = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
  'contractual': 'Contractual',
};

// GET all candidates
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CANDIDATE_VIEW))) {
      throw APIError.forbidden('You do not have permission to view candidates');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };

    if (status !== null && status !== '') {
      where.status = status === 'true' || status === '1';
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.potentialCandidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          country: { select: { country_name: true } },
          status_master: { select: { status: true } },
        },
      }),
      prisma.potentialCandidate.count({ where }),
    ]);

    // Get designation names
    const designationIds = candidates.map((c: any) => c.designation).filter(Boolean);
    const designations = await prisma.designationMaster.findMany({
      where: { id: { in: designationIds as number[] } },
      select: { id: true, designation_name: true },
    });
    const designationMap = new Map(designations.map((d: any) => [d.id, d.designation_name]));

    const data = candidates.map((c: any) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email,
      contactNumber: c.contact_number,
      gender: GENDER_MAP[c.gender || 0] || '-',
      dob: c.dob,
      address: c.address,
      nationality: c.nationality,
      country: c.country?.country_name || '-',
      designation: designationMap.get(c.designation) || '-',
      designationId: c.designation,
      engagementMethod: ENGAGEMENT_MAP[c.engagement_method || ''] || c.engagement_method || '-',
      statusName: c.status_master?.status || (c.status ? 'Active' : 'Inactive'),
      statusMasterId: c.status_master_id,
      status: c.status,
      createdAt: c.created_at,
    }));

    return NextResponse.json({
      success: true,
      code: 200,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get candidates error:', error);
    return NextResponse.json({ success: false, code: 500, error: error.message }, { status: 500 });
  }
}

// POST - Create candidate
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CANDIDATE_CREATE))) {
      throw APIError.forbidden('You do not have permission to create candidates');
    }

    const body = await request.json();

    const {
      first_name, last_name, email, contact_number, gender, dob, address,
      nationality, potential_country, designation, engagement_method, status_master_id,
    } = body;

    if (!first_name || !email) {
      return NextResponse.json({ success: false, error: 'First name and email are required' }, { status: 400 });
    }

    // Check email uniqueness
    const existingEmail = await prisma.potentialCandidate.findFirst({
      where: { email, deleted_at: null },
    });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
    }

    const candidate = await prisma.potentialCandidate.create({
      data: {
        first_name,
        last_name,
        email,
        contact_number,
        gender: gender ? parseInt(gender) : null,
        dob: dob ? new Date(dob) : null,
        address,
        nationality,
        potential_country: potential_country ? parseInt(potential_country) : null,
        designation: designation ? parseInt(designation) : null,
        engagement_method: engagement_method,
        status_master_id: status_master_id ? parseInt(status_master_id) : 46, // Default candidate status
        status: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: candidate,
      message: 'Candidate created successfully',
    });
  } catch (error: any) {
    console.error('Create candidate error:', error);
    return NextResponse.json({ success: false, code: 500, error: error.message }, { status: 500 });
  }
}

