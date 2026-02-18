import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

// Get vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.VENDOR_VIEW))) {
      throw APIError.forbidden('You do not have permission to view vendors');
    }

    const { id } = await params;
    const vendorId = parseInt(id);

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId, deleted_at: null },
      include: {
        country: true,
        contacts: {
          where: { deleted_at: null },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get projects for this vendor
    const projects = await prisma.projectManagement.findMany({
      where: { service_delivery_partner_id: vendorId, project_management_deleted_at: null },
      select: {
        id: true,
        project_name: true,
        status_master_id: true,
        project_management_created_at: true,
        client: {
          select: {
            client_name: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        id: vendor.id,
        vendorId: vendor.service_delivery_id || `VND-${vendor.id}`,
        vendorName: vendor.vendor_name,
        vendorWebsite: vendor.vendor_website,
        vendorAddress: vendor.work_address,
        contactNumber: vendor.contact_number,
        countryId: vendor.work_location,
        countryName: vendor.country?.country_name,
        status: vendor.status,
        createdAt: vendor.created_at,
        contacts: vendor.contacts?.map(c => ({
          id: c.id,
          person_name: c.person_name,
          email: c.email,
          contact_num: c.contact_num,
          designation: '', // Designation needs to be joined from designation_master
        })) || [],
        projects: projects.map(p => ({
          id: p.id,
          projectName: p.project_name,
          statusMasterId: p.status_master_id,
          clientName: p.client?.client_name,
          createdAt: p.project_management_created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get vendor error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.VENDOR_EDIT))) {
      throw APIError.forbidden('You do not have permission to edit vendors');
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    const body = await request.json();

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    const existingVendor = await prisma.vendors.findFirst({
      where: { id: vendorId, deleted_at: null },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Update vendor
    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.vendor_name !== undefined) updateData.vendor_name = body.vendor_name;
    if (body.vendor_website !== undefined) updateData.vendor_website = body.vendor_website;
    if (body.vendor_address !== undefined) updateData.work_address = body.vendor_address;
    if (body.contact_number !== undefined) updateData.contact_number = body.contact_number;
    if (body.country_id !== undefined) updateData.work_location = body.country_id;
    if (body.status !== undefined) updateData.status = body.status;

    const vendor = await prisma.vendors.update({
      where: { id: vendorId },
      data: updateData,
    });

    // Update contacts if provided
    if (body.contacts && Array.isArray(body.contacts)) {
      // Soft delete existing contacts
      await prisma.vendorContactDetails.updateMany({
        where: { vendor_id: vendorId },
        data: { deleted_at: new Date() },
      });

      // Create new contacts
      for (const contact of body.contacts) {
        await prisma.vendorContactDetails.create({
          data: {
            vendor_id: vendorId,
            person_name: contact.person_name,
            email: contact.email || '',
            contact_num: contact.contact_num || '',
            role_master_id: 6, // Default to Employee role
            designation_master_id: contact.designation_master_id || null,
            created_at: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: vendor,
      message: 'Vendor updated successfully',
    });
  } catch (error: any) {
    console.error('Update vendor error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// Delete vendor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.VENDOR_DELETE))) {
      throw APIError.forbidden('You do not have permission to delete vendors');
    }

    const { id } = await params;
    const vendorId = parseInt(id);

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId, deleted_at: null },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        deleted_at: new Date(),
        status: false,
      },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      message: 'Vendor deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete vendor error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}

