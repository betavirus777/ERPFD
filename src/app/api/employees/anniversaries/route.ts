
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Fetch active employees with DOB and DOJ
    const employees = await prisma.employeeOnboarding.findMany({
      where: {
        deleted_at: null,
        status: true,
      },
      select: {
        id: true,
        uid: true,
        first_name: true,
        last_name: true,
        dob: true,
        doj: true,
        designation_master: { select: { designation_name: true } }
      }
    });

    const today = new Date();
    const currentYear = today.getFullYear();

    const events: any[] = [];

    employees.forEach(emp => {
      // Check Birthday
      if (emp.dob) {
        const dob = new Date(emp.dob);
        const thisYearBday = new Date(currentYear, dob.getMonth(), dob.getDate());
        const nextYearBday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());

        // If birthday has passed this year, look at next year
        let nextBday = thisYearBday;
        if (thisYearBday < today) {
          nextBday = nextYearBday;
        }

        // Calculate days until
        const diffTime = nextBday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 60) { // Upcoming in 60 days
          events.push({
            type: 'birthday',
            date: nextBday,
            daysUntil: diffDays,
            name: `${emp.first_name} ${emp.last_name}`,
            designation: emp.designation_master?.designation_name,
            uid: emp.uid
          });
        }
      }

      // Check Anniversary (DOJ)
      if (emp.doj) {
        const doj = new Date(emp.doj);
        const thisYearAnniv = new Date(currentYear, doj.getMonth(), doj.getDate());
        const nextYearAnniv = new Date(currentYear + 1, doj.getMonth(), doj.getDate());

        let nextAnniv = thisYearAnniv;
        if (thisYearAnniv < today) {
          nextAnniv = nextYearAnniv;
        }

        const diffTime = nextAnniv.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate years of service
        const yearsOfService = nextAnniv.getFullYear() - doj.getFullYear();

        if (diffDays >= 0 && diffDays <= 60 && yearsOfService > 0) {
          events.push({
            type: 'anniversary',
            date: nextAnniv,
            daysUntil: diffDays,
            name: `${emp.first_name} ${emp.last_name}`,
            designation: emp.designation_master?.designation_name,
            years: yearsOfService,
            uid: emp.uid
          });
        }
      }
    });

    // Sort by nearest date
    events.sort((a, b) => a.daysUntil - b.daysUntil);

    // Take top N
    const upcomingEvents = events.slice(0, limit).map(e => ({
      ...e,
      date: e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return NextResponse.json({
      success: true,
      data: upcomingEvents
    });

  } catch (error: any) {
    console.error('Anniversaries Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch anniversaries' },
      { status: 500 }
    );
  }
}
