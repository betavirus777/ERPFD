import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get dashboard widgets for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    // Find employee by uid
    const employee = await prisma.employeeOnboarding.findFirst({
      where: { 
        uid,
        deleted_at: null,
      },
      select: { 
        id: true, 
        role_master_id: true,
        first_name: true,
        last_name: true,
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get widget access for the user
    const widgetAccess = await prisma.widget_role_access.findMany({
      where: {
        uid,
        status: true,
        widget_deleted_at: null,
      },
      include: {
        widget_master: true,
      },
    });

    const currentYear = new Date().getFullYear();
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const dashboardWidgets = [];

    for (const access of widgetAccess) {
      const widget = access.widget_master;
      if (!widget || !widget.status) continue;

      const widgetData: any = {
        widgetId: widget.id,
        widgetName: widget.widget_name,
        widgetIcon: widget.widget_icon,
        widgetType: widget.widget_type,
        count: 0,
        data: [],
      };

      try {
        switch (widget.id) {
          case 1: // Total Employees
            widgetData.count = await prisma.employeeOnboarding.count({
              where: { status: true, deleted_at: null },
            });
            break;

          case 2: // Total Opportunities
            widgetData.count = await prisma.opportunity.count({
              where: { status: true, opportunity_deleted_at: null },
            });
            break;

          case 3: // Won Opportunities (status_master_id = 11)
            widgetData.count = await prisma.opportunity.count({
              where: { status: true, status_master_id: 11, opportunity_deleted_at: null },
            });
            break;

          case 4: // Total Clients
            widgetData.count = await prisma.clients.count({
              where: { status: true, deleted_at: null },
            });
            break;

          case 5: // Total Vendors
            widgetData.count = await prisma.vendors.count({
              where: { status: true, deleted_at: null },
            });
            break;

          case 7: // Potential Candidates
            widgetData.count = await prisma.potentialCandidate.count({
              where: { status: true, deleted_at: null },
            });
            break;

          case 9: // Internal Employees
            widgetData.count = await prisma.employeeOnboarding.count({
              where: { status: true, employee_type: 'Internal', deleted_at: null },
            });
            break;

          case 10: // External Employees
            widgetData.count = await prisma.employeeOnboarding.count({
              where: { status: true, employee_type: 'External', deleted_at: null },
            });
            break;

          case 14: // Total Tasks
            widgetData.count = await prisma.projectTask.count({
              where: {
                status: true,
                project_management: {
                  status: true,
                  project_management_deleted_at: null,
                },
              },
            });
            break;

          case 17: // Leave Stats - use ApplyLeave summary
            const leaveStats = await prisma.applyLeave.groupBy({
              by: ['type'],
              where: {
                employee_onboarding_id: uid,
                status: true,
                deleted_at: null,
              },
              _sum: { number_of_days: true },
              _count: true,
            });

            const leaveTypes = await prisma.leaveMaster.findMany({
              where: { status: true },
              select: { id: true, leave_type: true, max_leave_count: true },
            });

            const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.id, lt]));

            widgetData.data = leaveStats.map(stat => {
              const leaveType = leaveTypeMap.get(stat.type || 0);
              return {
                leaveType: leaveType?.leave_type || 'N/A',
                leaveTaken: stat._sum.number_of_days || 0,
                TotalLeave: leaveType?.max_leave_count || 0,
                remaining: (leaveType?.max_leave_count || 0) - (stat._sum.number_of_days || 0),
              };
            });
            break;

          case 28: // Employees on Leave
            const leavesApproved = await prisma.applyLeave.findMany({
              where: {
                status: true,
                status_master_id: 2, // Approved
                deleted_at: null,
                to_date: { gte: today },
                from_date: { lte: thirtyDaysFromNow },
              },
              take: 10,
            });

            // Get employee details for each leave
            const leaveEmployeeIds = [...new Set(leavesApproved.map((l: any) => l.employee_onboarding_id))];
            const leaveEmployees = await prisma.employeeOnboarding.findMany({
              where: { uid: { in: leaveEmployeeIds } },
              select: { uid: true, first_name: true, last_name: true, email: true, employee_photo: true },
            });
            const leaveEmployeeMap = new Map(leaveEmployees.map((e: any) => [e.uid, e]));

            widgetData.count = leavesApproved.length;
            widgetData.data = leavesApproved.map((leave: any) => {
              const emp = leaveEmployeeMap.get(leave.employee_onboarding_id);
              return {
                uid: emp?.uid,
                name: `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim(),
                email: emp?.email,
                photo: emp?.employee_photo,
                fromDate: leave.from_date?.toISOString().split('T')[0],
                toDate: leave.to_date?.toISOString().split('T')[0],
                numberOfDays: leave.number_of_days || 0,
              };
            });
            break;

          case 29: // Expiring Documents
            const expiringDocs = await prisma.employee_onboard_document.findMany({
              where: {
                deleted_at: null,
                end_date: {
                  lte: thirtyDaysFromNow,
                  gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                },
                employee_onboarding: {
                  status: true,
                  deleted_at: null,
                },
              },
              include: {
                employee_onboarding: {
                  select: {
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    employee_photo: true,
                  },
                },
                employee_document_master: {
                  select: { document_type_name: true },
                },
              },
              take: 10,
            });

            widgetData.count = expiringDocs.length;
            widgetData.data = expiringDocs.map((doc: any) => {
              const endDate = doc.end_date ? new Date(doc.end_date) : null;
              const daysToExpiry = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return {
                uid: doc.employee_onboarding?.uid,
                name: `${doc.employee_onboarding?.first_name || ''} ${doc.employee_onboarding?.last_name || ''}`.trim(),
                email: doc.employee_onboarding?.email,
                photo: doc.employee_onboarding?.employee_photo,
                documentType: doc.employee_document_master?.document_type_name || 'Document',
                expiryDate: endDate?.toISOString().split('T')[0],
                daysToExpiry: Math.abs(daysToExpiry),
                isExpired: daysToExpiry < 0,
                documentId: doc.id,
              };
            });
            break;

          case 30: // Birthdays & Anniversaries
            const employees = await prisma.employeeOnboarding.findMany({
              where: {
                status: true,
                deleted_at: null,
                dob: { not: null },
              },
              select: {
                uid: true,
                first_name: true,
                last_name: true,
                email: true,
                employee_photo: true,
                dob: true,
                doj: true,
              },
              take: 100,
            });

            const celebrations: any[] = [];
            employees.forEach((emp: any) => {
              const events: any[] = [];
              
              if (emp.dob) {
                const dob = new Date(emp.dob);
                const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
                if (birthdayThisYear < today) {
                  birthdayThisYear.setFullYear(currentYear + 1);
                }
                if (birthdayThisYear >= today && birthdayThisYear <= thirtyDaysFromNow) {
                  const age = birthdayThisYear.getFullYear() - dob.getFullYear();
                  events.push({
                    type: 'birthday',
                    date: birthdayThisYear.toISOString().split('T')[0],
                    description: `Birthday - ${age} years`,
                  });
                }
              }

              if (emp.doj) {
                const doj = new Date(emp.doj);
                const anniversaryThisYear = new Date(currentYear, doj.getMonth(), doj.getDate());
                if (anniversaryThisYear < today) {
                  anniversaryThisYear.setFullYear(currentYear + 1);
                }
                if (anniversaryThisYear >= today && anniversaryThisYear <= thirtyDaysFromNow) {
                  const years = anniversaryThisYear.getFullYear() - doj.getFullYear();
                  events.push({
                    type: 'anniversary',
                    date: anniversaryThisYear.toISOString().split('T')[0],
                    description: `Work Anniversary - ${years} years`,
                  });
                }
              }

              if (events.length > 0) {
                celebrations.push({
                  uid: emp.uid,
                  name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                  email: emp.email,
                  photo: emp.employee_photo,
                  events,
                });
              }
            });

            widgetData.count = celebrations.length;
            widgetData.data = celebrations.slice(0, 10);
            break;

          default:
            // For unhandled widgets, just set defaults
            break;
        }
      } catch (err) {
        console.error(`Error processing widget ${widget.id}:`, err);
      }

      dashboardWidgets.push(widgetData);
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: dashboardWidgets,
    });
  } catch (error: any) {
    console.error('Dashboard widgets error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch dashboard widgets' },
      { status: 500 }
    );
  }
}
