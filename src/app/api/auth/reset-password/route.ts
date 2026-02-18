import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendEmail, emailTemplates, logEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token, password, password_confirmation } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password !== password_confirmation) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token },
    });

    if (!resetToken || !resetToken.status) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Invalid Token' },
        { status: 404 }
      );
    }

    // Check if token is expired (1 hour)
    const tokenAge = resetToken.created_at ? Date.now() - resetToken.created_at.getTime() : 0;
    if (tokenAge > 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.login.findFirst({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Email not found' },
        { status: 404 }
      );
    }

    // Get employee if available
    let employee = null;
    if (user.user_id) {
      employee = await prisma.employeeOnboarding.findFirst({
        where: { uid: user.user_id },
        select: { first_name: true, last_name: true },
      });
    }

    // Check password history (last 4 passwords)
    const passwordHistory = await prisma.loginPasswordHistory.findMany({
      where: { login_id: user.user_id },
      orderBy: { created_at: 'desc' },
      take: 4,
    });

    const hashedNewPassword = await hashPassword(password);

    // Update password
    await prisma.login.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    // Save to password history
    await prisma.loginPasswordHistory.create({
      data: {
        login_id: user.user_id,
        password: hashedNewPassword,
      },
    });

    // Limit history to 4 passwords
    if (passwordHistory.length >= 4) {
      const oldestPassword = passwordHistory[passwordHistory.length - 1];
      await prisma.loginPasswordHistory.delete({
        where: { id: oldestPassword.id },
      });
    }

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { status: false },
    });

    // Send notification email
    if (employee) {
      const userName = `${employee.first_name} ${employee.last_name}`;
      const logo = process.env.APP_LOGO || 'https://erp.forwarddefense.com/assets/img/logo2.png';
      const dateTime = new Date().toISOString();
      
      const emailHtml = emailTemplates.passwordChanged(userName, dateTime, logo);

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Password has been Updated',
        html: emailHtml,
      });

      await logEmail(
        prisma,
        process.env.MAIL_FROM_ADDRESS || '',
        user.email,
        'Password changed notification',
        emailResult.success ? 'Success' : 'Failed',
        emailResult.error
      );
    }

    return NextResponse.json({ 
      success: true, 
      code: 200, 
      data: 'Password Reset Successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
