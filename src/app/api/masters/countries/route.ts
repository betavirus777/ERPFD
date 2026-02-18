import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const countries = await prisma.countryMaster.findMany({
      where: { status: true },
      select: {
        id: true,
        country_name: true,
        country_code: true,
        country_currency: true,
      },
      orderBy: { country_name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: countries.map((c: any) => ({
        id: c.id,
        countryName: c.country_name,
        countryCode: c.country_code,
        countryCurrency: c.country_currency,
      })),
    });
  } catch (error: any) {
    console.error('Get countries error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}

