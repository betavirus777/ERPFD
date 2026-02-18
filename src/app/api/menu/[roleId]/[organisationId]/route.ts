import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get menu items for a role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string; organisationId: string }> }
) {
  try {
    const { roleId, organisationId } = await params;
    const roleIdNum = parseInt(roleId);
    const orgIdNum = parseInt(organisationId);

    if (isNaN(roleIdNum)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Get role permissions with their related permissions and menus
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role_id: roleIdNum,
        organization_id: orgIdNum,
        status: true,
      },
      include: {
        permission: {
          include: {
            menu: true,
            module_master: true,
          },
        },
      },
    });

    // Build menu structure from role permissions
    const menuMap = new Map<number, any>();
    
    for (const rp of rolePermissions) {
      const permission = rp.permission;
      if (!permission || !permission.status_master_id) continue;

      const menu = permission.menu;
      const module = permission.module_master;
      
      if (!menu || !module) continue;

      const moduleId = module.id;

      if (!menuMap.has(moduleId)) {
        menuMap.set(moduleId, {
          id: moduleId,
          name: module.module_name,
          fontIcon: 'la la-folder',
          routeUrl: '',
          type: 'module',
          sub_menu: [],
        });
      }

      const menuItem = menuMap.get(moduleId);
      
      // Add menu as submenu
      const existingSubMenu = menuItem.sub_menu.find((sm: any) => sm.id === menu.id);
      if (!existingSubMenu) {
        menuItem.sub_menu.push({
          id: menu.id,
          name: menu.menu_name,
          fontIcon: menu.font_icon || 'la la-file',
          routeUrl: menu.route_url || '',
          type: 'menu',
        });
      }
    }

    // Convert to array
    const menuItems = Array.from(menuMap.values()).filter(
      item => item.sub_menu.length > 0
    );

    // Sort by module name
    menuItems.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      code: 200,
      data: menuItems,
    });
  } catch (error: any) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
