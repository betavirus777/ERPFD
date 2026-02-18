"use client"

import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Download,
  TrendingUp,
  Building2,
  Briefcase,
  FolderKanban
} from 'lucide-react'
import Link from 'next/link'

const reportCategories = [
  {
    title: 'Employee Reports',
    description: 'Employee listings, headcount, and demographics',
    icon: Users,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    reports: [
      { name: 'Employee List Report', href: '/reports?type=employees' },
      { name: 'Department Wise Report', href: '/reports?type=departments' },
      { name: 'New Joiners Report', href: '/reports?type=new-joiners' },
      { name: 'Exit Report', href: '/reports?type=exits' },
    ]
  },
  {
    title: 'Leave Reports',
    description: 'Leave balances, usage, and trends',
    icon: Calendar,
    color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    reports: [
      { name: 'Leave Summary Report', href: '/reports?type=leave-summary' },
      { name: 'Leave Balance Report', href: '/reports?type=leave-balance' },
      { name: 'Approved Leaves Report', href: '/reports?type=approved-leaves' },
      { name: 'Monthly Leave Report', href: '/reports?type=monthly-leave' },
    ]
  },
  {
    title: 'Financial Reports',
    description: 'Revenue, profitability, and financial analysis',
    icon: DollarSign,
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    reports: [
      { name: 'Project Profitability', href: '/reports?type=project-profitability' },
      { name: 'Quarter Analysis', href: '/reports?type=quarter-analysis' },
      { name: 'Annual Analysis', href: '/reports?type=annual-analysis' },
      { name: 'Revenue by Client', href: '/reports?type=revenue-client' },
    ]
  },
  {
    title: 'Project Reports',
    description: 'Project status, milestones, and progress',
    icon: FolderKanban,
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    reports: [
      { name: 'Project Status Report', href: '/reports?type=project-status' },
      { name: 'Project Timeline Report', href: '/reports?type=project-timeline' },
      { name: 'Resource Utilization', href: '/reports?type=resource-utilization' },
      { name: 'Task Progress Report', href: '/reports?type=task-progress' },
    ]
  },
  {
    title: 'Sales Reports',
    description: 'Opportunity pipeline and sales analysis',
    icon: Briefcase,
    color: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    reports: [
      { name: 'Pipeline Report', href: '/reports?type=pipeline' },
      { name: 'Opportunity by Stage', href: '/reports?type=opportunity-stage' },
      { name: 'Account Analysis', href: '/reports?type=account-analysis' },
      { name: 'Sales Rep Performance', href: '/reports?type=sales-rep' },
    ]
  },
  {
    title: 'Client Reports',
    description: 'Client analytics and relationship insights',
    icon: Building2,
    color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    reports: [
      { name: 'Client Summary', href: '/reports?type=client-summary' },
      { name: 'Client Revenue Report', href: '/reports?type=client-revenue' },
      { name: 'Client Distribution', href: '/reports?type=client-distribution' },
      { name: 'Business Distribution', href: '/reports?type=business-distribution' },
    ]
  },
]

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Generate and analyze business reports
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Reports</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Generated This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Downloads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {category.reports.map((report, idx) => (
                  <Link key={idx} href={report.href}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{report.name}</span>
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Reports Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recently Generated Reports</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Employee List Report', date: 'Jan 5, 2026', type: 'Employee', status: 'completed' },
              { name: 'Leave Summary - December 2025', date: 'Jan 4, 2026', type: 'Leave', status: 'completed' },
              { name: 'Project Profitability Q4 2025', date: 'Jan 3, 2026', type: 'Financial', status: 'completed' },
              { name: 'Sales Pipeline Report', date: 'Jan 2, 2026', type: 'Sales', status: 'completed' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <FileText className="w-5 h-5 text-[#1e3a5f] dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{report.type} • {report.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#1e3a5f] dark:text-blue-400">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
