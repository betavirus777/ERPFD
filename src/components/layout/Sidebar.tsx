"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { usePermission, ROLES } from '@/hooks/usePermission'
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Target,
  UserPlus,
  CalendarDays,
  FileText,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Loader2,
  Receipt,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  id: string
  name: string
  icon: React.ReactNode
  href?: string
  submenu?: MenuItem[]
  tourId?: string
}

interface MenuGroup {
  id: string
  name: string
  items: MenuItem[]
}

// Build menu based on user's role
function buildMenu(roleId: number): MenuGroup[] {
  const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.HR
  const isFinance = roleId === ROLES.FINANCE
  const isSales = roleId === ROLES.SALES
  const isOperations = roleId === ROLES.OPERATIONS

  const groups: MenuGroup[] = []

  // ── MAIN ────────────────────────────────────────────────
  const dashboardItems: MenuItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      tourId: 'nav-dashboard',
      submenu: [
        { id: 'my-dashboard', name: 'My Dashboard', icon: null, href: '/my-dashboard' },
        // Only admins see the admin dashboard
        ...(isAdmin ? [{ id: 'admin-dashboard', name: 'Admin Dashboard', icon: null, href: '/dashboard' }] : []),
      ],
    },
  ]
  groups.push({ id: 'main', name: 'Main', items: dashboardItems })

  // ── WORKFORCE ────────────────────────────────────────────
  const workforceItems: MenuItem[] = []

  if (isAdmin) {
    workforceItems.push({
      id: 'employees',
      name: 'Employees',
      icon: <Users className="w-5 h-5" />,
      tourId: 'nav-employees',
      submenu: [
        { id: 'emp-list', name: 'All Employees', icon: null, href: '/employees' },
        { id: 'emp-export', name: 'Export Data', icon: null, href: '/employees/export' },
      ],
    })
  }

  // Leave Management
  workforceItems.push({
    id: 'leave',
    name: 'Leave Management',
    icon: <CalendarDays className="w-5 h-5" />,
    tourId: 'nav-leave',
    submenu: [
      ...(isAdmin ? [{ id: 'leave-list', name: 'Leave Requests', icon: null, href: '/leave' }] : []),
      { id: 'leave-my', name: 'My Leave', icon: null, href: '/leave/my-leave' },
    ],
  })

  // Document Requests
  workforceItems.push({
    id: 'document-requests',
    name: 'Document Requests',
    icon: <FileText className="w-5 h-5" />,
    tourId: 'nav-document-requests',
    submenu: [
      { id: 'doc-my', name: 'My Requests', icon: null, href: '/document-requests' },
      ...(isAdmin ? [{ id: 'doc-manage', name: 'Manage Requests', icon: null, href: '/document-requests/manage' }] : []),
    ],
  })

  // Candidates — only admins
  if (isAdmin) {
    workforceItems.push({
      id: 'candidates',
      name: 'Candidates',
      icon: <UserPlus className="w-5 h-5" />,
      href: '/candidates',
      tourId: 'nav-candidates',
    })
  }

  groups.push({ id: 'workforce', name: 'Workforce', items: workforceItems })

  // ── BUSINESS OPERATIONS ──────────────────────────────────
  // Only visible to: Admin, Sales, Operations
  if (isAdmin || isSales || isOperations) {
    const bizItems: MenuItem[] = []

    if (isAdmin || isOperations) {
      bizItems.push({ id: 'clients', name: 'Clients', icon: <Building2 className="w-5 h-5" />, href: '/clients', tourId: 'nav-clients' })
      bizItems.push({ id: 'vendors', name: 'Vendors', icon: <Building2 className="w-5 h-5" />, href: '/vendors' })
    }

    bizItems.push({ id: 'projects', name: 'Projects', icon: <FolderKanban className="w-5 h-5" />, href: '/projects', tourId: 'nav-projects' })
    bizItems.push({ id: 'opportunities', name: 'Opportunities', icon: <Target className="w-5 h-5" />, href: '/opportunities' })

    groups.push({ id: 'business', name: 'Business Operations', items: bizItems })
  }

  // ── FINANCE & SALES ──────────────────────────────────────
  // Only: Admin, Finance, Sales
  if (isAdmin || isFinance || isSales) {
    const finItems: MenuItem[] = []

    if (isAdmin || isSales) {
      finItems.push({ id: 'sales', name: 'Sales & Invoices', icon: <Receipt className="w-5 h-5" />, href: '/sales', tourId: 'nav-sales' })
    }
    if (isAdmin || isFinance) {
      finItems.push({ id: 'expenses', name: 'Expenses', icon: <DollarSign className="w-5 h-5" />, href: '/expenses' })
    }
    if (isAdmin) {
      finItems.push({
        id: 'reports',
        name: 'Reports',
        icon: <BarChart3 className="w-5 h-5" />,
        tourId: 'nav-reports',
        submenu: [
          { id: 'report-leave', name: 'Leave Report', icon: null, href: '/reports/leave' },
          { id: 'report-expiry', name: 'Document Expiry', icon: null, href: '/reports/expiry' },
        ],
      })
    }

    if (finItems.length > 0) groups.push({ id: 'finance', name: 'Finance & Sales', items: finItems })
  }

  // ── ADMINISTRATION ───────────────────────────────────────
  // Only admins
  if (isAdmin) {
    groups.push({
      id: 'admin',
      name: 'Administration',
      items: [
        {
          id: 'settings',
          name: 'Settings',
          icon: <Settings className="w-5 h-5" />,
          tourId: 'nav-settings',
          submenu: [
            { id: 'settings-main', name: 'General Settings', icon: null, href: '/settings' },
            { id: 'settings-masters', name: 'Master Data', icon: null, href: '/settings/masters' },
            { id: 'settings-access', name: 'Access Control', icon: null, href: '/settings/access-control' },
            { id: 'settings-audit', name: 'Audit Trail', icon: null, href: '/settings/audit-trail' },
          ],
        },
      ],
    })
  }

  return groups
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const menuGroups = user ? buildMenu(user.roleId) : []

  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.submenu) {
          const hasActiveChild = item.submenu.some(sub => sub.href === pathname)
          if (hasActiveChild) setExpandedItems(prev => new Set(prev).add(item.id))
        }
      })
    })
    setLoading(false)
  }, [pathname, user])

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) newSet.delete(itemId)
      else newSet.add(itemId)
      return newSet
    })
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/my-dashboard' || href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (loading || !user) {
    return (
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Sidebar Header */}
      <div data-tour="sidebar-logo" className="flex-shrink-0 h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/my-dashboard" className="flex items-center gap-3">
          <Image
            src="/logo2.png"
            alt="Forward Defense"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Forward Defense</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">HRMS Platform</span>
          </div>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {menuGroups.map(group => (
          <div key={group.id}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {group.name}
            </h3>
            <div className="space-y-1">
              {group.items.map(item => (
                <div key={item.id}>
                  {item.submenu ? (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      data-tour={item.tourId}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm",
                        "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-500 dark:text-gray-400">{item.icon}</div>
                        <span>{item.name}</span>
                      </div>
                      {expandedItems.has(item.id)
                        ? <ChevronDown className="w-4 h-4 transition-transform" />
                        : <ChevronRight className="w-4 h-4 transition-transform" />
                      }
                    </button>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      onClick={() => onClose()}
                      data-tour={item.tourId}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive(item.href)
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(isActive(item.href) ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                      {isActive(item.href) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                    </Link>
                  )}

                  {/* Submenu */}
                  {item.submenu && expandedItems.has(item.id) && (
                    <div className="mt-1 ml-8 space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                      {item.submenu.map(sub => (
                        <Link
                          key={sub.id}
                          href={sub.href || '#'}
                          onClick={() => onClose()}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
                            isActive(sub.href)
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                          )}
                        >
                          {isActive(sub.href) && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r" />
                          )}
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">FDCS HRMS</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">© 2025 Forward Defense</div>
      </div>
    </div>
  )
}
