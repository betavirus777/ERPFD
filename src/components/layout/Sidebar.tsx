"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
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
  Shield,
  BarChart3,
  X,
  Loader2
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
  group?: string
  submenu?: MenuItem[]
  permission?: string
  tourId?: string
}

const menuGroups = [
  {
    id: 'main',
    name: 'Main',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        tourId: 'nav-dashboard',
        submenu: [
          { id: 'my-dashboard', name: 'My Dashboard', icon: null, href: '/my-dashboard' },
          { id: 'admin-dashboard', name: 'Admin Dashboard', icon: null, href: '/dashboard' },
        ]
      },
    ]
  },
  {
    id: 'workforce',
    name: 'Workforce Management',
    items: [
      {
        id: 'employees',
        name: 'Employees',
        icon: <Users className="w-5 h-5" />,
        tourId: 'nav-employees',
        submenu: [
          { id: 'emp-list', name: 'All Employees', icon: null, href: '/employees' },
          { id: 'emp-export', name: 'Export Data', icon: null, href: '/employees/export' },
        ]
      },
      {
        id: 'leave',
        name: 'Leave Management',
        icon: <CalendarDays className="w-5 h-5" />,
        tourId: 'nav-leave',
        submenu: [
          { id: 'leave-list', name: 'Leave Requests', icon: null, href: '/leave' },
          { id: 'leave-my', name: 'My Leave', icon: null, href: '/leave/my-leave' },
        ]
      },
      {
        id: 'document-requests',
        name: 'Document Requests',
        icon: <FileText className="w-5 h-5" />,
        tourId: 'nav-document-requests',
        submenu: [
          { id: 'doc-my', name: 'My Requests', icon: null, href: '/document-requests' },
          { id: 'doc-manage', name: 'Manage Requests', icon: null, href: '/document-requests/manage' },
        ]
      },
      { id: 'candidates', name: 'Candidates', icon: <UserPlus className="w-5 h-5" />, href: '/candidates', tourId: 'nav-candidates' },
    ]
  },
  {
    id: 'business',
    name: 'Business Operations',
    items: [
      { id: 'clients', name: 'Clients', icon: <Building2 className="w-5 h-5" />, href: '/clients', tourId: 'nav-clients' },
      { id: 'vendors', name: 'Vendors', icon: <Building2 className="w-5 h-5" />, href: '/vendors' },
      { id: 'projects', name: 'Projects', icon: <FolderKanban className="w-5 h-5" />, href: '/projects', tourId: 'nav-projects' },
      { id: 'opportunities', name: 'Opportunities', icon: <Target className="w-5 h-5" />, href: '/opportunities' },
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Sales',
    items: [
      { id: 'sales', name: 'Sales & Invoices', icon: <DollarSign className="w-5 h-5" />, href: '/sales', tourId: 'nav-sales' },
      { id: 'expenses', name: 'Expenses', icon: <DollarSign className="w-5 h-5" />, href: '/expenses' },
      {
        id: 'reports',
        name: 'Reports',
        icon: <BarChart3 className="w-5 h-5" />,
        tourId: 'nav-reports',
        submenu: [
          { id: 'report-leave', name: 'Leave Report', icon: null, href: '/reports/leave' },
          { id: 'report-expiry', name: 'Document Expiry', icon: null, href: '/reports/expiry' },
        ]
      },
    ]
  },
  {
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
        ]
      },
    ]
  }
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auto-expand active parent menus
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.submenu) {
          const hasActiveChild = item.submenu.some(sub => sub.href === pathname)
          if (hasActiveChild) {
            setExpandedItems(prev => new Set(prev).add(item.id))
          }
        }
      })
    })
    setLoading(false)
  }, [pathname])

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (loading) {
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
      {/* Sidebar Header - Fixed */}
      {/* <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo2.png"
            alt="Forward Defense"
            width={140}
            height={20}
            className="object-contain"
            priority
          />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div> */}

      <div data-tour="sidebar-logo" className="flex-shrink-0 h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo2.png"
            alt="Forward Defense"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Forward Defense
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              HRMS Platform
            </span>
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
                  {/* Main Menu Item */}
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
                        <div className="text-gray-500 dark:text-gray-400">
                          {item.icon}
                        </div>
                        <span>{item.name}</span>
                      </div>
                      {expandedItems.has(item.id) ? (
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform" />
                      )}
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
                      <div className={cn(
                        isActive(item.href)
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                      {isActive(item.href) && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                      )}
                    </Link>
                  )}

                  {/* Submenu Items */}
                  {item.submenu && expandedItems.has(item.id) && (
                    <div className="mt-1 ml-8 space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                      {item.submenu.map(subitem => (
                        <Link
                          key={subitem.id}
                          href={subitem.href || '#'}
                          onClick={() => onClose()}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
                            isActive(subitem.href)
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                          )}
                        >
                          {isActive(subitem.href) && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r"></div>
                          )}
                          {subitem.name}
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

      {/* Sidebar Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">FDCS HRMS</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          © 2025 Forward Defense
        </div>
      </div>
    </div >
  )
}

