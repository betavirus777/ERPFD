import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendEmail, emailTemplates, logEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.login.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 404, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get employee details if available
    let employee = null;
    if (user.user_id) {
      employee = await prisma.employeeOnboarding.findFirst({
        where: { uid: user.user_id },
        select: { first_name: true, last_name: true },
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        status: true,
      },
    });

    // Build reset link
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Get user name
    const userName = employee 
      ? `${employee.first_name} ${employee.last_name}`
      : email;

    // Send email
    const logo = process.env.APP_LOGO || 'https://erp.forwarddefense.com/assets/img/logo2.png';
    const emailHtml = emailTemplates.resetPassword(userName, resetLink, logo);

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: emailHtml,
    });

    await logEmail(
      prisma,
      process.env.MAIL_FROM_ADDRESS || '',
      email,
      'Password reset link sent',
      emailResult.success ? 'Success' : 'Failed',
      emailResult.error
    );

    return NextResponse.json({ 
      success: true, 
      code: 200, 
      data: 'Reset password link sent to your email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

