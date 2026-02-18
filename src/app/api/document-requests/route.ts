import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.employeeId) throw APIError.unauthorized();

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'admin' or 'user'

    // Simple permission check (should be more robust)
    const isAdmin = mode === 'admin';

    if (isAdmin) {
      if (!(await hasPermission(user, PERMISSIONS.EMPLOYEE_EDIT))) {
        throw APIError.forbidden('You do not have permission to view all requests');
      }
    }

    const requests = await prisma.documentRequest.findMany({
      where: isAdmin ? {} : { employee_id: user.employeeId },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true,
            department: true
          }
        },
        attachments: true
      },
      orderBy: { created_at: 'desc' }
    });

    return apiResponse(requests, HttpStatus.OK);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.employeeId) throw APIError.unauthorized();

    const body = await request.json();
    const { document_type, reason } = body;

    if (!document_type) throw APIError.badRequest('Document type is required');

    const docRequest = await prisma.documentRequest.create({
      data: {
        employee_id: user.employeeId,
        document_type,
        reason,
        status: 'Pending'
      }
    });

    return apiResponse(docRequest, HttpStatus.CREATED);
  } catch (error) {
    return apiError(error);
  }
}
