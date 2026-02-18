import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Relationship mapping
const RELATIONSHIP_MAP: Record<number, string> = {
  1: 'Father',
  2: 'Mother',
  3: 'Spouse',
  4: 'Sibling',
  5: 'Child',
  6: 'Son',
  7: 'Daughter',
  8: 'Brother',
  9: 'Sister',
  10: 'Friend',
  11: 'Other',
};

// Get documents
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

    // Users can only view their own documents unless they're admin/HR
    if (id !== user.employeeUid && !user.roleId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own documents' },
        { status: 403 }
      );
    }

    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 });
    }

    const documents = await prisma.employee_onboard_document.findMany({
      where: { employee_onboarding_id: employeeId, deleted_at: null },
      include: { employee_document_master: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: documents.map((doc: any) => ({
        id: doc.id,
        document_master_id: doc.document_master_id,
        documentTypeName: doc.employee_document_master?.document_type_name || '-',
        document_number: doc.document_number,
        upload_document: doc.upload_document,
        upload_name: doc.upload_name,
        start_date: doc.start_date,
        end_date: doc.end_date,
      })),
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add/Update document
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

    if (body.id) {
      // Update existing
      const doc = await prisma.employee_onboard_document.update({
        where: { id: body.id },
        data: {
          document_master_id: body.document_master_id ? parseInt(body.document_master_id) : undefined,
          document_number: body.document_number,
          upload_document: body.upload_document,
          upload_name: body.upload_name,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
          updated_at: new Date(),
        },
        include: { employee_document_master: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          document_master_id: doc.document_master_id,
          documentTypeName: doc.employee_document_master?.document_type_name,
          document_number: doc.document_number,
          upload_document: doc.upload_document,
          start_date: doc.start_date,
          end_date: doc.end_date,
        },
        message: 'Document updated successfully',
      });
    } else {
      // Create new
      const doc = await prisma.employee_onboard_document.create({
        data: {
          employee_onboarding_id: employeeId,
          document_master_id: parseInt(body.document_master_id),
          document_number: body.document_number,
          upload_document: body.upload_document,
          upload_name: body.upload_name,
          start_date: body.start_date ? new Date(body.start_date) : null,
          end_date: body.end_date ? new Date(body.end_date) : null,
        },
        include: { employee_document_master: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          document_master_id: doc.document_master_id,
          documentTypeName: doc.employee_document_master?.document_type_name,
          document_number: doc.document_number,
          upload_document: doc.upload_document,
          start_date: doc.start_date,
          end_date: doc.end_date,
        },
        message: 'Document added successfully',
      });
    }
  } catch (error: any) {
    console.error('Save document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(request.url);
    const docId = url.searchParams.get('docId');

    if (!docId) {
      return NextResponse.json({ success: false, error: 'Document ID required' }, { status: 400 });
    }

    await prisma.employee_onboard_document.update({
      where: { id: parseInt(docId) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

