"use client"

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Building2,
  Users,
  Shield,
  Briefcase,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Mail,
  Bell,
  Settings2,
  ChevronRight,
  Lock,
  UserCog,
  Layers,
  Database,
  Globe,
  Palette
} from 'lucide-react'
import Link from 'next/link'

const masterCategories = [
  {
    id: 'organization',
    name: 'Organization',
    description: 'Company profile, branches, and departments',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    items: [
      { name: 'Company Profile', href: '/settings/company' },
      { name: 'Departments', href: '/settings/departments' },
      { name: 'Branches', href: '/settings/branches' },
      { name: 'Teams', href: '/settings/teams' },
    ]
  },
  {
    id: 'employees',
    name: 'Employee Masters',
    description: 'Designations, roles, and employee categories',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    items: [
      { name: 'Designations', href: '/settings/designations' },
      { name: 'Employee Categories', href: '/settings/employee-categories' },
      { name: 'Visa Types', href: '/settings/visa-types' },
      { name: 'Document Types', href: '/settings/document-types' },
    ]
  },
  {
    id: 'leave',
    name: 'Leave Settings',
    description: 'Leave types, policies, and allocations',
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    items: [
      { name: 'Leave Types', href: '/settings/leave-types' },
      { name: 'Leave Policies', href: '/settings/leave-policies' },
      { name: 'Holidays', href: '/settings/holidays' },
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Billing',
    description: 'Tax settings, currencies, and payment terms',
    icon: CreditCard,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    items: [
      { name: 'Tax Settings', href: '/settings/tax' },
      { name: 'Currencies', href: '/settings/currencies' },
      { name: 'Payment Terms', href: '/settings/payment-terms' },
      { name: 'Invoice Templates', href: '/settings/invoice-templates' },
    ]
  },
  {
    id: 'location',
    name: 'Location Masters',
    description: 'Countries, states, and cities',
    icon: Globe,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/30',
    items: [
      { name: 'Countries', href: '/settings/countries' },
      { name: 'States', href: '/settings/states' },
      { name: 'Cities', href: '/settings/cities' },
    ]
  },
  {
    id: 'crm',
    name: 'CRM Settings',
    description: 'Industries, lead sources, and opportunity stages',
    icon: Briefcase,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/30',
    items: [
      { name: 'Industries', href: '/settings/industries' },
      { name: 'Lead Sources', href: '/settings/lead-sources' },
      { name: 'Opportunity Stages', href: '/settings/opportunity-stages' },
      { name: 'Project Status', href: '/settings/project-status' },
    ]
  },
]

const accessControlItems = [
  {
    id: 'roles',
    name: 'Roles & Permissions',
    description: 'Manage user roles and their access levels',
    icon: Shield,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    href: '/settings/roles',
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Manage system users and their credentials',
    icon: UserCog,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    href: '/settings/users',
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
  {
    id: 'security',
    name: 'Security Settings',
    description: 'Password policies and 2FA settings',
    icon: Lock,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    href: '/settings/security',
  },
]

const systemSettings = [
  {
    id: 'email',
    name: 'Email Configuration',
    description: 'SMTP settings and email templates',
    icon: Mail,
    href: '/settings/email',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Configure notification preferences',
    icon: Bell,
    href: '/settings/notifications',
  },
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Logo, colors, and branding',
    icon: Palette,
    href: '/settings/appearance',
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Third-party integrations and APIs',
    icon: Layers,
    href: '/settings/integrations',
  },
  {
    id: 'backup',
    name: 'Backup & Storage',
    description: 'Data backup and file storage settings',
    icon: Database,
    href: '/settings/backup',
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
            <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700">
              <Settings2 className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Master Data Tab */}
          <TabsContent value="masters" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {masterCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="border border-gray-100 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.bgColor}`}>
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-white">{category.name}</CardTitle>
                          <CardDescription className="text-sm">{category.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
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

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {systemSettings.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group"
                  >
                    <Card className="border border-gray-100 dark:border-gray-700 hover:border-[#1e3a5f]/30 dark:hover:border-blue-500/30 transition-colors h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#1e3a5f] dark:group-hover:text-blue-400 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Quick Info Card */}
            <Card className="border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                    <Settings2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">System Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                        <p className="font-medium text-gray-900 dark:text-white">2.0.0</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Environment</p>
                        <p className="font-medium text-gray-900 dark:text-white">Production</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                        <p className="font-medium text-gray-900 dark:text-white">Jan 6, 2026</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Database</p>
                        <p className="font-medium text-gray-900 dark:text-white">MySQL 8.0</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
