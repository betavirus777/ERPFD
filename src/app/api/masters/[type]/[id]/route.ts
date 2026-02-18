import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// PUT update master item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type, id } = await context.params
    const body = await request.json()

    try {
      const response = await fetch(`${BACKEND_URL}/api/masters/${type}/${id}`, {
        method: 'PUT',
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
      return NextResponse.json(data)
    } catch (backendError) {
      return NextResponse.json(
        { success: false, error: 'Master settings feature not yet available.' },
        { status: 503 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update master item' },
      { status: 500 }
    )
  }
}

// DELETE master item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type, id } = await context.params

    try {
      const response = await fetch(`${BACKEND_URL}/api/masters/${type}/${id}`, {
        method: 'DELETE',
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
      return NextResponse.json(
        { success: false, error: 'Master settings feature not yet available.' },
        { status: 503 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete master item' },
      { status: 500 }
    )
  }
}


