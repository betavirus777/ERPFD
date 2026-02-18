import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const countryId = searchParams.get('country_id');
        const countryName = searchParams.get('country_name');

        const whereClause: any = { flag: true };

        if (countryId) {
            whereClause.country_id = parseInt(countryId);
        } else if (countryName) {
            const country = await prisma.countryMaster.findFirst({
                where: { country_name: { contains: countryName } }, // Removed mode: 'insensitive' as generic contains is often CI in MySQL or simple enough
            });
            if (country) {
                whereClause.country_id = country.id;
            } else {
                // If country name specified but not found, maybe return empty or all? 
                // Better return empty to avoid confusion
                return NextResponse.json({
                    success: true,
                    code: 200,
                    data: [],
                });
            }
        }

        const states = await prisma.states.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                country_id: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            success: true,
            code: 200,
            data: states,
        });
    } catch (error: any) {
        console.error('Get states error:', error);
        return NextResponse.json(
            { success: false, code: 500, error: error.message || 'Failed to fetch states' },
            { status: 500 }
        );
    }
}
