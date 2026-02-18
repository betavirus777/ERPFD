import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

// Get all vendors
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.VENDOR_VIEW))) {
      throw APIError.forbidden('You do not have permission to view vendors');
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
        { vendor_name: { contains: search } },
        { service_delivery_id: { contains: search } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendors.findMany({
        where,
        include: {
          country: {
            select: { id: true, country_name: true },
          },
          states: {
            select: { id: true, name: true },
          },
          cities: {
            select: { id: true, name: true },
          },
          contacts: {
            select: {
              id: true,
              person_name: true,
              email: true,
              contact_num: true,
            },
            where: { deleted_at: null },
            take: 1,
          },
        },
        orderBy: { vendor_name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.vendors.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      code: 200,
      data: vendors.map((vendor: any) => ({
        id: vendor.id,
        serviceDeliveryId: vendor.service_delivery_id,
        vendorName: vendor.vendor_name,
        vendorWebsite: vendor.vendor_website,
        vendorType: vendor.vendor_type,
        contactNumber: vendor.contact_number,
        workAddress: vendor.work_address,
        status: vendor.status,
        createdAt: vendor.created_at,
        countryName: vendor.country?.country_name,
        stateName: vendor.states?.name,
        cityName: vendor.cities?.name,
        contactPerson: vendor.contacts?.[0]?.person_name || null,
        contactEmail: vendor.contacts?.[0]?.email,
        contactPhone: vendor.contacts?.[0]?.contact_num,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Vendors list error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// Create new vendor
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    if (!(await hasPermission(user, PERMISSIONS.VENDOR_CREATE))) {
      throw APIError.forbidden('You do not have permission to create vendors');
    }

    const body = await request.json();

    const {
      vendor_name,
      vendor_website,
      work_location,
      work_address,
      vendor_state_id,
      vendor_city_id,
      vendor_type,
      contact_number,
    } = body;

    if (!vendor_name) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Vendor name is required' },
        { status: 400 }
      );
    }

    // Generate service delivery ID
    const lastVendor = await prisma.vendors.findFirst({
      orderBy: { id: 'desc' },
      select: { service_delivery_id: true },
    });

    let serviceDeliveryId = 'SDP0001';
    if (lastVendor?.service_delivery_id) {
      const match = lastVendor.service_delivery_id.match(/SDP(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1] || '0');
        serviceDeliveryId = `SDP${String(lastNum + 1).padStart(4, '0')}`;
      }
    }

    const vendor = await prisma.vendors.create({
      data: {
        service_delivery_id: serviceDeliveryId,
        vendor_name,
        vendor_website,
        work_location,
        work_address,
        vendor_state_id,
        vendor_city_id,
        vendor_type,
        contact_number,
        status: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: vendor,
      message: 'Vendor created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create vendor error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
