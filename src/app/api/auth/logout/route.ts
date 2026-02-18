import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, code: 401, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real application, you would invalidate the token here
    // For JWT, you typically:
    // 1. Add the token to a blacklist (Redis)
    // 2. Or use short-lived tokens with refresh tokens

    return NextResponse.json({ 
      success: true, 
      code: 200, 
      data: 'You have been successfully logged out.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

