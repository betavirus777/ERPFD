"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { EmployeeDetailView } from '@/components/employees/EmployeeDetailView'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function EmployeeDetailPage() {
  const params = useParams()
  const empId = parseInt(params.id as string)

  if (isNaN(empId)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-500">Invalid Employee ID</p>
          <Link href="/employees">
            <Button variant="outline">Back to Employees</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return <EmployeeDetailView empId={empId} />
}
