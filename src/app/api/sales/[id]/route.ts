import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ success: false, error: 'Invalid invoice ID' }, { status: 400 });
    }

    const invoice = await prisma.sales_invoice.findFirst({
      where: { id: invoiceId, sales_invoice_deleted_at: null },
      include: {
        clients: { select: { id: true, client_name: true } },
        status_master: { select: { id: true, status: true } },
        project_management: { select: { id: true, project_name: true, project_code: true } },
        country: { select: { id: true, country_currency: true } },
        sales_invoice_task: {
          where: { sales_invoice_task_deleted_at: null },
          include: {
            project_task: { select: { project_task_name: true } },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.sales_invoice_number,
        invoiceType: invoice.invoice_type,
        salesType: invoice.sales_type,
        clientId: invoice.client_id,
        clientName: invoice.clients?.client_name,
        projectId: invoice.project_management_id,
        projectName: invoice.project_management?.project_name,
        projectCode: invoice.project_management?.project_code,
        invoiceDate: invoice.sales_invoice_date,
        currencyId: invoice.sales_currency,
        currency: invoice.country?.country_currency,
        billingAddress: invoice.client_billing_address,
        billingCycleType: invoice.invoice_billing_cycle_type,
        subtotal: invoice.sales_invoice_total,
        vatAmount: invoice.invoice_vat_amount,
        grandTotal: invoice.invoice_grand_total,
        discountAmount: invoice.sales_discount_amount,
        statusId: invoice.status_master_id,
        statusName: invoice.status_master?.status,
        attachment: invoice.sales_attachement,
        reason: invoice.sales_invoice_reason,
        createdAt: invoice.sales_invoice_created_at,
        tasks: invoice.sales_invoice_task.map((t: any) => ({
          id: t.id,
          projectTaskId: t.project_task_id,
          taskName: t.project_task?.project_task_name,
          employeeId: t.sales_employee_id,
          invoiceDays: t.invoice_days,
          pendingDays: t.pending_invoice_days,
          amount: t.sales_amount,
          consultationRate: t.consultation_rate,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    const body = await request.json();

    if (isNaN(invoiceId)) {
      return NextResponse.json({ success: false, error: 'Invalid invoice ID' }, { status: 400 });
    }

    const existing = await prisma.sales_invoice.findFirst({
      where: { id: invoiceId, sales_invoice_deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: any = { sales_invoice_updated_at: new Date() };

    const stringFields = ['sales_type', 'invoice_type', 'client_billing_address', 'invoice_billing_cycle_type', 'sales_invoice_reason'];
    stringFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f]; });

    const intFields = ['client_id', 'project_management_id', 'sales_currency', 'status_master_id'];
    intFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f] ? parseInt(body[f]) : null; });

    const floatFields = ['sales_invoice_total', 'invoice_vat_amount', 'invoice_grand_total', 'sales_discount_amount'];
    floatFields.forEach(f => {
      if (body[f] !== undefined) {
        updateData[f] = parseFloat(body[f]) || 0;
        updateData[`base_currency_${f}`] = parseFloat(body[f]) || 0;
      }
    });

    if (body.sales_invoice_date) updateData.sales_invoice_date = new Date(body.sales_invoice_date);

    const invoice = await prisma.sales_invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        clients: { select: { client_name: true } },
        status_master: { select: { status: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.sales_invoice_number,
        clientName: invoice.clients?.client_name,
        statusName: invoice.status_master?.status,
        grandTotal: invoice.invoice_grand_total,
      },
      message: 'Invoice updated successfully',
    });
  } catch (error: any) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Soft delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ success: false, error: 'Invalid invoice ID' }, { status: 400 });
    }

    await prisma.sales_invoice.update({
      where: { id: invoiceId },
      data: { sales_invoice_deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

