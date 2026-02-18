import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const allowanceTypes = await prisma.allowance_type_master.findMany({
      where: { allowance_deleted_at: null, status: true },
      select: {
        id: true,
        allowance_type: true,
        status: true,
      },
      orderBy: { allowance_type: 'asc' },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: allowanceTypes.map((at: any) => ({
        id: at.id,
        allowanceType: at.allowance_type,
        status: at.status,
      })),
    });
  } catch (error: any) {
    console.error('Get allowance types error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch allowance types' },
      { status: 500 }
    );
  }
}

