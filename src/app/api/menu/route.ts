import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET menu items based on user role
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user info from token or session
    // For now, we'll use a placeholder - you should decode the JWT or get from session
    const searchParams = request.nextUrl.searchParams
    const roleId = searchParams.get('roleId') || '1'
    const organizationId = searchParams.get('organizationId') || '1'
    const version = searchParams.get('version') || 'new'

    const response = await fetch(
      `${BACKEND_URL}/api/getMenu/${roleId}/${organizationId}/${version}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}


