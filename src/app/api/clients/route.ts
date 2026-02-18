import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';
import { withProfiling } from '@/lib/api-profiler';

// Get all clients
export const GET = withProfiling(async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CLIENT_VIEW))) {
      throw APIError.forbidden('You do not have permission to view clients');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (status !== null && status !== '') {
      where.status = status === 'true' || status === '1';
    }

    if (search) {
      where.OR = [
        { client_name: { contains: search } },
        { client_id: { contains: search } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where,
        select: {
          id: true,
          client_id: true,
          client_name: true,
          client_website: true,
          contact_number: true,
          client_work_location: true,
          status: true,
          created_at: true,
          country: {
            select: { id: true, country_name: true },
          },
          states: {
            select: { id: true, name: true },
          },
          cities: {
            select: { id: true, name: true },
          },
          clients_personal_details: {
            select: {
              id: true,
              person_name: true,
              email: true,
              contact_num: true,
              salutation: true,
              client_details_is_primary: true,
            },
            where: { deleted_at: null },
            take: 1,
          },
        },
        orderBy: { client_name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.clients.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      code: 200,
      data: clients.map((client: any) => ({
        id: client.id,
        clientId: client.client_id,
        clientName: client.client_name,
        clientWebsite: client.client_website,
        contactNumber: client.contact_number,
        location: client.client_work_location,
        status: client.status,
        createdAt: client.created_at,
        countryName: client.country?.country_name,
        stateName: client.states?.name,
        cityName: client.cities?.name,
        contactPerson: client.clients_personal_details?.[0]?.person_name || null,
        contactEmail: client.clients_personal_details?.[0]?.email,
        contactPhone: client.clients_personal_details?.[0]?.contact_num,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Clients list error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
});

// Create new client
export const POST = withProfiling(async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CLIENT_CREATE))) {
      throw APIError.forbidden('You do not have permission to create clients');
    }

    const body = await request.json();

    const {
      client_name,
      client_website,
      client_work_location,
      client_work_address,
      client_state_id,
      client_city_id,
      contact_number,
    } = body;

    if (!client_name) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Generate client ID
    const lastClient = await prisma.clients.findFirst({
      orderBy: { id: 'desc' },
      select: { client_id: true },
    });

    let clientId = 'CLI0001';
    if (lastClient?.client_id) {
      const match = lastClient.client_id.match(/CLI(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1] || '0');
        clientId = `CLI${String(lastNum + 1).padStart(4, '0')}`;
      }
    }

    const client = await prisma.clients.create({
      data: {
        client_id: clientId,
        client_name,
        client_website,
        client_work_location,
        client_work_address,
        client_state_id,
        client_city_id,
        contact_number,
        status: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: client,
      message: 'Client created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
});
