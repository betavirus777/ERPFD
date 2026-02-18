import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOTP, storeOTP } from '@/lib/auth';
import { sendEmail, emailTemplates, logEmail } from '@/lib/email';

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
        { success: false, code: 404, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${user.id}|${ip}`;
    const now = Date.now();
    const rateLimit = rateLimitMap.get(rateLimitKey);

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= 2) {
          return NextResponse.json(
            { success: false, code: 429, error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(user.id.toString(), otp, 10);

    // Log OTP
    await prisma.otpLog.create({
      data: {
        user_id: user.user_id,
        email: user.email,
        otp,
        ip_address: ip,
      },
    });

    // Get user name from employee if available
    let userName = email;
    if (user.user_id) {
      const employee = await prisma.employeeOnboarding.findFirst({
        where: { uid: user.user_id },
        select: { first_name: true, last_name: true },
      });
      if (employee) {
        userName = `${employee.first_name} ${employee.last_name}`;
      }
    }

    // Send email
    const logo = process.env.APP_LOGO || 'https://erp.forwarddefense.com/assets/img/logo2.png';
    const emailHtml = emailTemplates.loginOtp(userName, otp, logo);

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Your Login OTP',
      html: emailHtml,
    });

    await logEmail(
      prisma,
      process.env.MAIL_FROM_ADDRESS || '',
      user.email,
      `Login OTP: ${otp}`,
      emailResult.success ? 'Success' : 'Failed',
      emailResult.error
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, code: 500, error: 'Failed to send OTP. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      code: 200, 
      data: 'OTP sent successfully.' 
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
