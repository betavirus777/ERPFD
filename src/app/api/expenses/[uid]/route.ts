import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// GET single expense
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
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

    const { uid } = await context.params

    const response = await fetch(`${BACKEND_URL}/api/expenses/${uid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expense'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// PUT update expense
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
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

    if (!(await hasPermission(user, PERMISSIONS.EXPENSE_EDIT))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { uid } = await context.params
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/expenses/${uid}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update expense'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
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

    if (!(await hasPermission(user, PERMISSIONS.EXPENSE_DELETE))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { uid } = await context.params

    const response = await fetch(`${BACKEND_URL}/api/expenses/${uid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}


