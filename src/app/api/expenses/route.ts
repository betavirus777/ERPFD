import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET all expenses
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
    if (!user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    if (!(await hasPermission(user, PERMISSIONS.EXPENSE_VIEW))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (category) params.append('category', category)
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/expenses?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Backend not ready')
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (backendError) {
      // Return empty array if backend is not available
      return NextResponse.json({
        success: true,
        data: []
      })
    }
  } catch (error) {
    return NextResponse.json(
      { success: true, data: [] },
      { status: 200 }
    )
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    if (!(await hasPermission(user, PERMISSIONS.EXPENSE_CREATE))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json()

    try {
      const response = await fetch(`${BACKEND_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Backend not ready')
      }

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (backendError) {
      return NextResponse.json(
        { success: false, error: 'Expenses feature not yet available. Please contact administrator.' },
        { status: 503 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

