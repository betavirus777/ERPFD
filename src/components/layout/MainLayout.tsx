"use client"

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { WalkthroughProvider } from '@/components/walkthrough/WalkthroughProvider'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <WalkthroughProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar - Fixed and persistent */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Content */}
          <main className="flex-1">
            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/80 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </WalkthroughProvider>
  )
}

