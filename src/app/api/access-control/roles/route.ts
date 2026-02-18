import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions'

// GET all roles
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

      const roles = await prisma.roleMaster.findMany({
        where: {
          deleted_at: null,
          status_master_id: true
        },
        orderBy: {
          role_name: 'asc'
        }
      })

      const formattedRoles = roles.map(r => ({
        id: r.id,
        roleName: r.role_name,
        roleDescription: r.role_description || ''
      }))

      return NextResponse.json({
        success: true,
        data: formattedRoles
      })
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }
  })
}

// POST create new role
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.ACCESS_CONTROL_EDIT)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { roleName, description, permissions } = body

      if (!roleName) {
        return NextResponse.json(
          { success: false, error: 'Role name is required' },
          { status: 400 }
        )
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create Role
        const newRole = await tx.roleMaster.create({
          data: {
            role_name: roleName,
            role_description: description,
            status_master_id: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        })

        // Create Permissions if provided
        if (permissions && Array.isArray(permissions)) {
          const validPermissions = permissions
            .filter((p: any) => p.checked === 1 || p.checked === true)
            .map((p: any) => ({
              role_id: newRole.id,
              permission_id: p.permissionId,
              status: true,
              created_at: new Date(),
              updated_at: new Date()
            }))

          if (validPermissions.length > 0) {
            await tx.rolePermission.createMany({
              data: validPermissions
            })
          }
        }

        return newRole
      })

      return NextResponse.json({
        success: true,
        data: {
          id: result.id,
          roleName: result.role_name,
          roleDescription: result.role_description,
        },
        message: 'Role created successfully'
      })
    } catch (error: any) {
      console.error('Failed to create role:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create role' },
        { status: 500 }
      )
    }
  })
}



