import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all opportunities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const stageId = searchParams.get('stage_id');

    const skip = (page - 1) * limit;

    const where: any = {
      opportunity_deleted_at: null,
    };

    if (status !== null && status !== '') {
      where.status = status === 'true' || status === '1';
    }

    if (clientId) {
      where.client_id = parseInt(clientId);
    }

    if (stageId) {
      where.status_master_id = parseInt(stageId);
    }

    if (search) {
      where.OR = [
        { opportunity_name: { contains: search } },
        { opportunity_code: { contains: search } },
      ];
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        select: {
          id: true,
          opportunity_code: true,
          opportunity_name: true,
          opportunity_description: true,
          opportunity_total_cost: true,
          status: true,
          status_master_id: true,
          client_id: true,
          opportunity_owner_name: true,
          opportunity_created_at: true,
          client: {
            select: {
              id: true,
              client_name: true,
            },
          },
          status_master: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { opportunity_created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      code: 200,
      data: opportunities.map((opp: any) => ({
        id: opp.id,
        opportunityCode: opp.opportunity_code,
        opportunityName: opp.opportunity_name,
        opportunityDescription: opp.opportunity_description,
        opportunityValue: opp.opportunity_total_cost,
        status: opp.status,
        statusMasterId: opp.status_master_id,
        clientId: opp.client_id,
        clientName: opp.client?.client_name,
        stageName: opp.status_master?.status,
        createdAt: opp.opportunity_created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Opportunities list error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

// Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      opportunity_name,
      opportunity_description,
      client_id,
      opportunity_total_cost,
      status_master_id,
    } = body;

    if (!opportunity_name) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Opportunity name is required' },
        { status: 400 }
      );
    }

    // Generate opportunity code
    const lastOpp = await prisma.opportunity.findFirst({
      orderBy: { id: 'desc' },
      select: { opportunity_code: true },
    });
    
    let oppCode = 'OPP001';
    if (lastOpp?.opportunity_code) {
      const lastNum = parseInt(lastOpp.opportunity_code.replace('OPP', '') || '0');
      oppCode = `OPP${String(lastNum + 1).padStart(3, '0')}`;
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        opportunity_code: oppCode,
        opportunity_name,
        opportunity_description,
        client_id: client_id || null,
        opportunity_total_cost: opportunity_total_cost || 0,
        status_master_id: status_master_id || 6,
        status: true,
        opportunity_total_client_vat_amount: 0,
        opportunity_asset_sales_line_total: 0,
        opportunity_total_vendor_vat_amount: 0,
        opportunity_vendor_purchase_line_total: 0,
        opportunity_created_at: new Date(),
        opportunity_updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: opportunity,
      message: 'Opportunity created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create opportunity error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
