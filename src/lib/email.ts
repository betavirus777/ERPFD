import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Azure Communication Services / Office 365 SMTP Configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // TLS
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || `"${process.env.MAIL_FROM_NAME || 'HRMS'}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Email Templates
export const emailTemplates = {
  loginOtp: (name: string, otp: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login OTP</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Login Verification Code</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">Your OTP for login is:</p>
        <div style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 8px; display: inline-block; letter-spacing: 8px; margin: 20px 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    </body>
    </html>
  `,

  resetPassword: (name: string, resetLink: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">You have requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">This link is valid for 60 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
        <p style="color: #10b981; word-break: break-all; font-size: 14px;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
  `,

  passwordChanged: (name: string, dateTime: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Password Updated</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">Your password has been updated on ${dateTime}.</p>
        <p style="color: #666; font-size: 16px;">If you did not make this change, please contact the administrator immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated notification from HRMS.</p>
      </div>
    </body>
    </html>
  `,

  leaveApproved: (name: string, leaveType: string, fromDate: string, toDate: string, approvedBy: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Approved</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #10b981; margin-bottom: 20px;">✓ Leave Approved</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">Your leave request has been approved.</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${fromDate}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${toDate}</p>
          <p style="margin: 5px 0;"><strong>Approved By:</strong> ${approvedBy}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated notification from HRMS.</p>
      </div>
    </body>
    </html>
  `,

  leaveRejected: (name: string, leaveType: string, fromDate: string, toDate: string, reason: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Rejected</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #ef4444; margin-bottom: 20px;">✗ Leave Rejected</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">Your leave request has been rejected.</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${fromDate}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${toDate}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated notification from HRMS.</p>
      </div>
    </body>
    </html>
  `,

  documentExpiry: (name: string, documentType: string, expiryDate: string, logo?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Expiry Reminder</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; margin-bottom: 30px;">` : ''}
        <h2 style="color: #f59e0b; margin-bottom: 20px;">⚠ Document Expiry Reminder</h2>
        <p style="color: #666; font-size: 16px;">Hello ${name},</p>
        <p style="color: #666; font-size: 16px;">This is a reminder that your document is expiring soon.</p>
        <div style="background-color: #fef3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Document Type:</strong> ${documentType}</p>
          <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
        </div>
        <p style="color: #666; font-size: 16px;">Please ensure to renew your document before it expires.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated notification from HRMS.</p>
      </div>
    </body>
    </html>
  `,
};

// Log email to database
export const logEmail = async (
  prisma: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  sender: string,
  receiver: string,
  content: string,
  status: 'Success' | 'Failed',
  comment?: string
) => {
  try {
    await prisma.emailLog.create({
      data: {
        email_sender: sender,
        email_receiver: receiver,
        email_content: content,
        email_status: status,
        email_comment: comment,
      },
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
};

