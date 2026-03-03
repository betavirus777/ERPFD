"use client"

import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Shield,
  FileText,
  Database,
  Settings2,
  ChevronRight,
  Building2,
  Users,
  Calendar,
  CreditCard,
  Globe,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'

// Only routes that actually exist in /src/app/settings/
const masterCategories = [
  {
    id: 'masters',
    name: 'Master Data',
    description: 'Manage designations, roles, leave types, and document types',
    icon: Database,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    href: '/settings/masters',
    items: [
      { name: 'Designations', href: '/settings/masters' },
      { name: 'Roles', href: '/settings/masters' },
      { name: 'Leave Types', href: '/settings/masters' },
      { name: 'Document Types', href: '/settings/masters' },
    ]
  },
]

const accessControlItems = [
  {
    id: 'access-control',
    name: 'Roles & Permissions',
    description: 'Manage user roles and their permission levels',
    icon: Shield,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    href: '/settings/access-control',
  },
  {
    id: 'audit',
    name: 'Audit Trail',
    description: 'View system activity and change history',
    icon: FileText,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
    href: '/settings/audit-trail',
  },
]

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your system configuration and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="masters" className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger value="masters" className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700">
              <Database className="w-4 h-4 mr-2" />
              Master Data
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700">
              <Shield className="w-4 h-4 mr-2" />
              Access Control
            </TabsTrigger>
          </TabsList>

          {/* Master Data Tab */}
          <TabsContent value="masters" className="space-y-6">
            <Card className="border border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">Master Data</CardTitle>
                    <CardDescription className="text-sm">
                      Manage designations, roles, leave types, and document types
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href="/settings/masters"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Manage All Masters</p>
                    <p className="text-xs text-gray-500 mt-0.5">Designations, Roles, Leave Types, Document Types</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accessControlItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group"
                  >
                    <Card className="border border-gray-100 dark:border-gray-700 hover:border-[#1e3a5f]/30 dark:hover:border-blue-500/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${item.bgColor}`}>
                            <Icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#1e3a5f] dark:group-hover:text-blue-400 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a5f] dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
