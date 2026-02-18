import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

// Get client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CLIENT_VIEW))) {
      throw APIError.forbidden('You do not have permission to view clients');
    }

    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const client = await prisma.clients.findFirst({
      where: { id: clientId, deleted_at: null },
      include: {
        country: true,
        cities: true,
        states: true,
        clients_personal_details: {
          where: { deleted_at: null },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get opportunities for this client
    const opportunities = await prisma.opportunity.findMany({
      where: { client_id: clientId, opportunity_deleted_at: null },
      select: {
        id: true,
        opportunity_name: true,
        status_master_id: true,
        opportunity_created_at: true,
      },
      take: 10,
    });

    // Get projects for this client
    const projects = await prisma.projectManagement.findMany({
      where: { client_id: clientId, project_management_deleted_at: null },
      select: {
        id: true,
        project_name: true,
        status_master_id: true,
        project_management_created_at: true,
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        ...client,
        contacts: client.clients_personal_details,
        opportunities,
        projects,
      },
    });
  } catch (error: any) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CLIENT_EDIT))) {
      throw APIError.forbidden('You do not have permission to edit clients');
    }

    const { id } = await params;
    const clientId = parseInt(id);
    const body = await request.json();

    if (isNaN(clientId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const existingClient = await prisma.clients.findFirst({
      where: { id: clientId, deleted_at: null },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Client not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    const allowedFields = [
      'client_name', 'client_website', 'client_work_address',
      'client_work_location', 'client_state_id', 'client_city_id',
      'contact_number', 'client_sector', 'status'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const client = await prisma.clients.update({
      where: { id: clientId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: client,
      message: 'Client updated successfully',
    });
  } catch (error: any) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

// Delete client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.CLIENT_DELETE))) {
      throw APIError.forbidden('You do not have permission to delete clients');
    }

    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const client = await prisma.clients.findFirst({
      where: { id: clientId, deleted_at: null },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Client not found' },
        { status: 404 }
      );
    }

    await prisma.clients.update({
      where: { id: clientId },
      data: {
        deleted_at: new Date(),
        status: false,
      },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      message: 'Client deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
