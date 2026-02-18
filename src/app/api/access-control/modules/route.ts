import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions'

// GET all modules with permissions
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.ACCESS_CONTROL_VIEW)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const modules = await prisma.moduleMaster.findMany({
        where: {
          status: true,
          deleted_at: null,
        },
        include: {
          permissions: {
            where: {
              status_master_id: true,
              deleted_at: null
            }
          }
        },
        orderBy: {
          module_name: 'asc'
        }
      })

      const formattedData = modules.map(m => ({
        module: m.module_name || 'Unknown Module',
        permissions: m.permissions.map(p => ({
          permissionId: p.id,
          description: p.description || '',
          checked: 0
        }))
      }))

      return NextResponse.json({
        success: true,
        data: formattedData
      })
    } catch (error) {
      console.error('Failed to fetch modules:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }
  })
}


