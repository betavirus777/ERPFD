import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const documentTypes = await prisma.employee_document_master.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        document_type_name: true,
      },
      orderBy: { document_type_name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: documentTypes.map((dt: any) => ({
        id: dt.id,
        documentTypeName: dt.document_type_name,
      })),
    });
  } catch (error: any) {
    console.error('Get document types error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch document types' },
      { status: 500 }
    );
  }
}

