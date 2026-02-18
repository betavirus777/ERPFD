import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET employee's own document requests
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

    const response = await fetch(`${BACKEND_URL}/api/getEmployeeDocumentRequests`, {
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


