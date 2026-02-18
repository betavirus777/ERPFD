import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions'

// GET role permissions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await context.params
      const roleId = parseInt(id)

      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.ACCESS_CONTROL_VIEW)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Check if role exists
      const role = await prisma.roleMaster.findUnique({
        where: { id: roleId }
      })

      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Role not found' },
          { status: 404 }
        )
      }

      // 1. Get all modules with their permissions
      const allModules = await prisma.moduleMaster.findMany({
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

      // 2. Get permissions assigned to this role
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role_id: roleId,
        }
      })

      const rolePermissionIds = new Set(rolePermissions.map(rp => rp.permission_id))

      // 3. Construct response
      const formattedData = allModules.map(m => ({
        module: m.module_name || 'Unknown Module',
        permissions: m.permissions.map(p => ({
          permissionId: p.id,
          description: p.description || '',
          checked: rolePermissionIds.has(p.id) ? 1 : 0
        }))
      }))

      return NextResponse.json({
        success: true,
        data: formattedData
      })
    } catch (error) {
      console.error('Failed to fetch role permissions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch role permissions' },
        { status: 500 }
      )
    }
  })
}

// PUT update role
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await context.params
      const roleId = parseInt(id)
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

      await prisma.$transaction(async (tx) => {
        // Update Role details
        await tx.roleMaster.update({
          where: { id: roleId },
          data: {
            role_name: roleName,
            role_description: description,
            updated_at: new Date()
          }
        })

        // Update Permissions
        // Strategy: Delete all existing permissions for this role and re-insert checked ones
        // This is safer to ensure sync
        if (permissions && Array.isArray(permissions)) {
          await tx.rolePermission.deleteMany({
            where: { role_id: roleId }
          })

          const validPermissions = permissions
            .filter((p: any) => p.checked === 1 || p.checked === true)
            .map((p: any) => ({
              role_id: roleId,
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
      })

      return NextResponse.json({
        success: true,
        message: 'Role updated successfully'
      })
    } catch (error: any) {
      console.error('Failed to update role:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update role' },
        { status: 500 }
      )
    }
  })
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await context.params
      const roleId = parseInt(id)
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.ACCESS_CONTROL_EDIT)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Soft delete
      await prisma.roleMaster.update({
        where: { id: roleId },
        data: {
          deleted_at: new Date(),
          status_master_id: false
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Role deleted successfully'
      })
    } catch (error) {
      console.error('Failed to delete role:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete role' },
        { status: 500 }
      )
    }
  })
}



