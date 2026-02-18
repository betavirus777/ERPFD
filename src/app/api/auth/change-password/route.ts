import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, verifyPassword, withAuth } from '@/lib/auth';
import { z } from 'zod';

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
    return withAuth(request, async (user) => {
        try {
            const body = await request.json();
            const { oldPassword, newPassword } = changePasswordSchema.parse(body);

            // Get current user login details
            const loginUser = await prisma.login.findUnique({
                where: { id: user.userId },
            });

            if (!loginUser) {
                return NextResponse.json(
                    { success: false, code: 404, error: 'User not found' },
                    { status: 404 }
                );
            }

            // Verify old password
            const isValid = await verifyPassword(oldPassword, loginUser.password);
            if (!isValid) {
                return NextResponse.json(
                    { success: false, code: 400, error: 'Incorrect old password' },
                    { status: 400 }
                );
            }

            // Update with new password
            const hashedPassword = await hashPassword(newPassword);

            await prisma.login.update({
                where: { id: user.userId },
                data: {
                    password: hashedPassword,
                    is_password_set: true, // Ensure this is set
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                message: 'Password changed successfully',
            });
        } catch (error: any) {
            console.error('Change password error:', error);
            return NextResponse.json(
                { success: false, code: 400, error: error instanceof z.ZodError ? (error as any).errors[0].message : ((error as any).message || 'Failed to change password') },
                { status: 400 }
            );
        }
    });
}
