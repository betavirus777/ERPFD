import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const { google2fasecret, emp_id, code } = await request.json();

    if (!google2fasecret || !emp_id || !code) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: google2fasecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps tolerance
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid OTP.' },
        { status: 400 }
      );
    }

    // Check if secret key already exists
    const existingKey = await prisma.employeeSecretkey.findFirst({
      where: { uid: emp_id },
    });

    if (!existingKey) {
      // Save the secret key for future logins
      await prisma.employeeSecretkey.create({
        data: {
          uid: emp_id,
          secretkey: google2fasecret,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      code: 200, 
      data: 'Valid OTP' 
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

