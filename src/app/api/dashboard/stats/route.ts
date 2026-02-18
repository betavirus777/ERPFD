
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth'; // Ensure this is imported
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { apiError, APIError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      // Allow if no user? No, dashboard assumes auth.
      // But for stats, maybe we should just return empty or error.
      // Let's assume strict auth.
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.DASHBOARD_VIEW))) {
      throw APIError.forbidden('You do not have permission to view the dashboard');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date ranges
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Current month boundaries
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Queries
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveToday,
      onLeaveThisMonth,
      activeClients,
      activeProjects,
      activeOpportunities,
      passportExpiring,
      otherDocsExpiring
    ] = await Promise.all([
      // Total
      prisma.employeeOnboarding.count({ where: { deleted_at: null } }),
      // Active
      prisma.employeeOnboarding.count({ where: { deleted_at: null, status: true } }),
      // Inactive
      prisma.employeeOnboarding.count({ where: { deleted_at: null, status: false } }),

      // On Leave Today
      prisma.applyLeave.count({
        where: {
          deleted_at: null,
          status_master_id: 2, // Approved
          from_date: { lte: new Date() },
          to_date: { gte: new Date() }
        }
      }).catch(() => 0),

      // On Leave This Month (with employee details)
      prisma.applyLeave.findMany({
        where: {
          deleted_at: null,
          status_master_id: 2, // Approved
          OR: [
            { from_date: { gte: monthStart, lte: monthEnd } },
            { to_date: { gte: monthStart, lte: monthEnd } },
            { AND: [{ from_date: { lte: monthStart } }, { to_date: { gte: monthEnd } }] }
          ]
        },
        orderBy: { from_date: 'asc' }
      }).catch(() => []),

      // Clients
      prisma.clients.count({ where: { deleted_at: null, status: true } }),
      // Projects
      prisma.projectManagement.count({ where: { status: true } }),
      // Opportunities
      prisma.opportunity.count({ where: { status: true } }),

      // Passport/Visa Expiring (6 months threshold) - ACTIVE employees only
      prisma.employee_onboard_document.findMany({
        where: {
          deleted_at: null,
          end_date: {
            gte: today,
            lte: sixMonthsFromNow
          },
          employee_document_master: {
            document_type_name: {
              in: ['Passport', 'Visa', 'passport', 'visa']
            }
          },
          employee_onboarding: {
            status: true,
            deleted_at: null
          }
        },
        select: {
          id: true,
          end_date: true,
          employee_document_master: {
            select: { document_type_name: true }
          },
          employee_onboarding: {
            select: {
              first_name: true,
              last_name: true,
              uid: true,
              email: true
            }
          }
        },
        orderBy: { end_date: 'asc' },
        take: 10
      }),

      // Other Docs Expiring (30 days threshold) - ACTIVE employees only
      prisma.employee_onboard_document.findMany({
        where: {
          deleted_at: null,
          end_date: {
            gte: today,
            lte: thirtyDaysFromNow
          },
          employee_document_master: {
            document_type_name: {
              notIn: ['Passport', 'Visa', 'passport', 'visa']
            }
          },
          employee_onboarding: {
            status: true,
            deleted_at: null
          }
        },
        select: {
          id: true,
          end_date: true,
          employee_document_master: {
            select: { document_type_name: true }
          },
          employee_onboarding: {
            select: {
              first_name: true,
              last_name: true,
              uid: true,
              email: true
            }
          }
        },
        orderBy: { end_date: 'asc' },
        take: 10
      })
    ]);

    // Get employee details for monthly leave
    const employeeUids = [...new Set((onLeaveThisMonth as any[]).map((l: any) => l.employee_onboarding_id))];
    const employees = await prisma.employeeOnboarding.findMany({
      where: { uid: { in: employeeUids } },
      select: { uid: true, first_name: true, last_name: true, employee_code: true, employee_photo: true }
    });
    const empMap = new Map(employees.map(e => [e.uid, e]));

    // Get leave types
    const leaveTypes = await prisma.leaveMaster.findMany({ where: { status: true } });
    const leaveTypeMap = new Map(leaveTypes.map(t => [t.id, t.leave_type]));

    // Combine expiring docs
    const allExpiringDocs = [...passportExpiring, ...otherDocsExpiring].map(doc => ({
      id: doc.id,
      name: `${doc.employee_onboarding?.first_name} ${doc.employee_onboarding?.last_name}`,
      email: doc.employee_onboarding?.email,
      documentType: doc.employee_document_master?.document_type_name,
      expiryDate: doc.end_date,
      daysToExpiry: doc.end_date ? Math.ceil((new Date(doc.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
    })).sort((a, b) => a.daysToExpiry - b.daysToExpiry);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveToday,
        activeClients,
        activeProjects,
        opportunities: activeOpportunities,
        pendingDocuments: allExpiringDocs.length,
        expiringDocumentsList: allExpiringDocs.slice(0, 10),

        // Monthly leave list for admin dashboard
        monthlyLeaveList: (onLeaveThisMonth as any[]).map((leave: any) => {
          const emp = empMap.get(leave.employee_onboarding_id);
          return {
            id: leave.id,
            employeeName: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
            employeeCode: emp?.employee_code,
            employeePhoto: emp?.employee_photo,
            fromDate: leave.from_date,
            toDate: leave.to_date,
            days: leave.number_of_days,
            leaveType: leaveTypeMap.get(leave.type) || 'Leave'
          };
        }),
        monthlyLeaveCount: (onLeaveThisMonth as any[]).length
      }
    });

  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
