import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET all document requests (admin)
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    if (!(await hasPermission(user, PERMISSIONS.EMPLOYEE_EDIT))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const documentType = searchParams.get('documentType') || ''
    const employeeUid = searchParams.get('employeeUid') || ''
    const fromDate = searchParams.get('fromDate') || ''
    const toDate = searchParams.get('toDate') || ''

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (documentType) params.append('documentType', documentType)
    if (employeeUid) params.append('employeeUid', employeeUid)
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)

    const response = await fetch(`${BACKEND_URL}/api/getAllDocumentRequests?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch requests'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}


