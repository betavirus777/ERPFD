import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    
    if (status !== null && status !== '') {
      where.status = status === '1' || status === 'true';
    }

    const teams = await prisma.teamMaster.findMany({
      where,
      select: {
        id: true,
        team_name: true,
        status: true,
      },
      orderBy: { team_name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: teams.map(team => ({
        id: team.id,
        teamName: team.team_name,
        status: team.status,
      })),
    });
  } catch (error: any) {
    console.error('Teams fetch error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
