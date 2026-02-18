import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const client_id = searchParams.get('client_id');

    const skip = (page - 1) * limit;

    const where: any = { sales_invoice_deleted_at: null };

    if (status) {
      where.status_master_id = parseInt(status);
    }

    if (client_id) {
      where.client_id = parseInt(client_id);
    }

    if (search) {
      where.OR = [
        { sales_invoice_number: { contains: search, mode: 'insensitive' } },
        { invoice_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.sales_invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sales_invoice_created_at: 'desc' },
        include: {
          clients: { select: { id: true, client_name: true } },
          status_master: { select: { id: true, status: true } },
          project_management: { select: { id: true, project_name: true, project_code: true } },
          country: { select: { id: true, country_currency: true } },
        },
      }),
      prisma.sales_invoice.count({ where }),
    ]);

    const data = invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.sales_invoice_number,
      invoiceType: inv.invoice_type,
      salesType: inv.sales_type,
      clientId: inv.client_id,
      clientName: inv.clients?.client_name || '-',
      projectId: inv.project_management_id,
      projectName: inv.project_management?.project_name || '-',
      projectCode: inv.project_management?.project_code,
      invoiceDate: inv.sales_invoice_date,
      currency: inv.country?.country_currency || 'AED',
      subtotal: inv.sales_invoice_total,
      vatAmount: inv.invoice_vat_amount,
      grandTotal: inv.invoice_grand_total,
      discountAmount: inv.sales_discount_amount,
      statusId: inv.status_master_id,
      statusName: inv.status_master?.status || '-',
      billingCycleType: inv.invoice_billing_cycle_type,
      attachment: inv.sales_attachement,
      createdAt: inv.sales_invoice_created_at,
    }));

    return NextResponse.json({
      success: true,
      code: 200,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ success: false, code: 500, error: error.message }, { status: 500 });
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sales_type, invoice_type, client_id, project_management_id, sales_currency,
      sales_invoice_date, sales_invoice_total, invoice_vat_amount, invoice_grand_total,
      sales_discount_amount, status_master_id, invoice_billing_cycle_type, created_by,
    } = body;

    if (!client_id) {
      return NextResponse.json({ success: false, error: 'Client is required' }, { status: 400 });
    }

    // Generate invoice number
    const lastInvoice = await prisma.sales_invoice.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const invoiceNumber = `INV-${String((lastInvoice?.id || 0) + 1).padStart(6, '0')}`;

    const invoice = await prisma.sales_invoice.create({
      data: {
        sales_invoice_number: invoiceNumber,
        sales_type,
        invoice_type,
        client_id: parseInt(client_id),
        project_management_id: project_management_id ? parseInt(project_management_id) : null,
        sales_currency: sales_currency ? parseInt(sales_currency) : 35, // Default AED
        sales_invoice_date: sales_invoice_date ? new Date(sales_invoice_date) : new Date(),
        sales_invoice_total: parseFloat(sales_invoice_total) || 0,
        base_currency_sales_invoice_total: parseFloat(sales_invoice_total) || 0,
        invoice_vat_amount: parseFloat(invoice_vat_amount) || 0,
        base_currency_invoice_vat_amount: parseFloat(invoice_vat_amount) || 0,
        invoice_grand_total: parseFloat(invoice_grand_total) || 0,
        base_currency_invoice_grand_total: parseFloat(invoice_grand_total) || 0,
        sales_discount_amount: parseFloat(sales_discount_amount) || 0,
        base_currency_sales_discount_amount: parseFloat(sales_discount_amount) || 0,
        status_master_id: status_master_id ? parseInt(status_master_id) : 28, // Default draft status
        invoice_billing_cycle_type,
        sales_invoice_created_at: new Date(),
        sales_invoice_updated_at: new Date(),
      },
      include: {
        clients: { select: { client_name: true } },
        status_master: { select: { status: true } },
      },
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.sales_invoice_number,
        clientName: invoice.clients?.client_name,
        statusName: invoice.status_master?.status,
        grandTotal: invoice.invoice_grand_total,
      },
      message: 'Invoice created successfully',
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ success: false, code: 500, error: error.message }, { status: 500 });
  }
}
