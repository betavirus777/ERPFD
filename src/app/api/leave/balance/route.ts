import { NextResponse } from 'next/server'
import { getAuthToken, getUserFromRequest } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUid = searchParams.get('uid') || user.employeeUid

    // 1. Get all active leave types
    const leaveTypes = await prisma.leaveMaster.findMany({
      where: {
        status: true,
        deleted_at: null
      }
    })

    // 2. Get all leave applications for the target user in current year
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31)

    const leaveApplications = await prisma.applyLeave.findMany({
      where: {
        employee_onboarding_id: targetUid,
        from_date: {
          gte: startOfYear,
          lte: endOfYear
        },
        deleted_at: null
      }
    })

    // 3. Calculate balances
    const balances = leaveTypes.map(type => {
      // Filter applications for this leave type
      const typeApps = leaveApplications.filter(app => app.type === type.id)

      // Calculate used (Approved = 2)
      const usedLeaves = typeApps
        .filter(app => app.status_master_id === 2)
        .reduce((sum, app) => sum + app.number_of_days, 0)

      // Calculate pending (Pending = 1)
      const pendingLeaves = typeApps
        .filter(app => app.status_master_id === 1)
        .reduce((sum, app) => sum + app.number_of_days, 0)

      return {
        leaveTypeId: type.id,
        leaveTypeName: type.leave_type,
        totalLeaves: type.max_leave_count,
        usedLeaves: usedLeaves,
        pendingLeaves: pendingLeaves,
        availableLeaves: type.max_leave_count - usedLeaves
      }
    })

    return NextResponse.json({
      success: true,
      data: balances.map(b => ({
        ...b,
        // Map fields for admin page compatibility
        allocated: b.totalLeaves,
        used: b.usedLeaves,
        pending: b.pendingLeaves,
        remaining: b.availableLeaves
      }))
    })

  } catch (error: any) {
    console.error('Leave balance error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
