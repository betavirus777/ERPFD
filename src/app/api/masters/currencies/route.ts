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

    // Filter to only countries with currency defined
    const currencies = countries
      .filter((c: any) => c.country_currency)
      .map((c: any) => ({
        id: c.id,
        currencyCode: c.country_currency,
        currencyName: `${c.country_currency} - ${c.country_name}`,
        countryName: c.country_name,
        countryCode: c.country_code,
      }));

    return NextResponse.json({
      success: true,
      code: 200,
      data: currencies,
    });
  } catch (error: any) {
    console.error('Get currencies error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}

