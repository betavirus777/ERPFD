import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, withAuth } from '@/lib/auth';
import { z } from 'zod';

const setPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
    return withAuth(request, async (user) => {
        try {
            const body = await request.json();
            const { password } = setPasswordSchema.parse(body);

            const hashedPassword = await hashPassword(password);

            // Update password and set flag to true
            await prisma.login.update({
                where: { id: user.userId },
                data: {
                    password: hashedPassword,
                    is_password_set: true,
                },
            });

            return NextResponse.json({
                success: true,
                code: 200,
                message: 'Password set successfully',
            });
        } catch (error: any) {
            console.error('Set password error:', error);
            return NextResponse.json(
                { success: false, code: 400, error: error instanceof z.ZodError ? (error as any).errors[0].message : ((error as any).message || 'Failed to set password') },
                { status: 400 }
            );
        }
    });
}
