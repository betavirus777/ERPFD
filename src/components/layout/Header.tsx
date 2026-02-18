"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Image from 'next/image'
import {
  Menu,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Lock,
  HelpCircle,
} from 'lucide-react'
import { useWalkthroughStore } from '@/store/walkthrough-store'
import { WALKTHROUGH_STEPS } from '@/components/walkthrough/walkthrough-steps'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { startTour } = useWalkthroughStore()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }

    localStorage.setItem('fdcs-theme', JSON.stringify(newTheme))
  }

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('fdcs-theme')
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setTheme(parsedTheme)
      } catch (e) {
        setTheme('light')
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 shadow-sm">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Help / Tour Button */}
        <button
          onClick={() => startTour(WALKTHROUGH_STEPS.length)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all hover:scale-105"
          title="Take a tour"
          aria-label="Platform tour"
          data-tour="help-button"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all hover:scale-105"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label="Toggle theme"
          data-tour="theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 relative transition-all hover:scale-105"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger data-tour="user-menu" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-lg ring-2 ring-white dark:ring-gray-800">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                {user?.roleName || 'Employee'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 hidden md:block text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {user?.roleName || 'Employee'}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/my-profile')} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/change-password')} className="cursor-pointer">
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

