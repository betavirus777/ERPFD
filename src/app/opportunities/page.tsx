"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { opportunitiesAPI } from '@/lib/api'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Building2,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Opportunity {
  id: number
  opportunity_code: string
  opportunity_name: string
  opportunity_description: string
  opportunity_value: number
  status: boolean
  stageName: string
  clientName: string
  created_at: string
}

const stageColors: Record<string, string> = {
  'Qualification': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Need Analysis': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Proposal': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Negotiation': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Closure - Won': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Closure - Lost': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Closure - Vapour': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 12 }
      if (search) params.search = search

      const response = await opportunitiesAPI.getAll(params)
      if (response?.data) {
        setOpportunities(response.data)
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages)
          setTotal(response.pagination.total)
        }
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOpportunities()
  }

  const formatCurrency = (value: number) => {
    if (!value) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.opportunity_value || 0), 0)
  const wonValue = opportunities
    .filter(opp => opp.stageName === 'Closure - Won')
    .reduce((sum, opp) => sum + (opp.opportunity_value || 0), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Opportunities</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Track your sales pipeline and potential deals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link href="/opportunities/new">
              <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#163050] text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Opportunity
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Opportunities</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(wonValue)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Won Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {opportunities.filter(o => o.stageName === 'Closure - Won').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Won Deals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <Button type="submit" variant="outline" className="shrink-0">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>

        {/* Opportunities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No opportunities found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first opportunity</p>
            <Link href="/opportunities/new">
              <Button className="bg-[#1e3a5f] hover:bg-[#163050] text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Opportunity
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {opportunities.map((opp) => (
                <div key={opp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={stageColors[opp.stageName] || 'bg-gray-100 text-gray-700'}>
                      {opp.stageName || 'Unknown'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/opportunities/${opp.id}`}>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/opportunities/${opp.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{opp.opportunity_code}</p>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {opp.opportunity_name}
                  </h3>

                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4" />
                    <span>{opp.clientName || 'No client assigned'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(opp.opportunity_value)}
                      </span>
                    </div>
                    <Link href={`/opportunities/${opp.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#1e3a5f] dark:text-blue-400">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, total)} of {total} opportunities
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
