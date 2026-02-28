import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const consentForms = await prisma.form_master.findMany({
      where: { deleted_at: null, status: true },
      select: {
        id: true,
        form_name: true,
        upload_document: true,
        status: true,
      },
      orderBy: { form_name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: consentForms.map((cf: any) => ({
        id: cf.id,
        formName: cf.form_name,
        formLink: cf.upload_document,
        status: cf.status,
      })),
    });
  } catch (error: any) {
    console.error('Get consent forms error:', error);
    return apiError(error);
  }
}

