import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { hasPermission, isAdmin, PERMISSIONS } from '@/lib/permissions'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET master data
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_VIEW)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const { type } = await context.params
      const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value;

      try {
        const response = await fetch(`${BACKEND_URL}/api/masters/${type}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

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
  })
}

// POST create new master item
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const hasAccess = isAdmin(user) || await hasPermission(user, PERMISSIONS.MASTER_CREATE)

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      const { type } = await context.params
      const body = await request.json()
      const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value;

      try {
        const response = await fetch(`${BACKEND_URL}/api/masters/${type}`, {
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
          { success: false, error: 'Master settings feature not yet available. Please contact administrator.' },
          { status: 503 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create master item' },
        { status: 500 }
      )
    }
  })
}



