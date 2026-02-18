import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { saveFile } from '@/lib/file-upload';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    const { id } = await params;
    const docRequest = await prisma.documentRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true,
            email: true
          }
        },
        attachments: true // Include attachments
      }
    });

    if (!docRequest) throw APIError.notFound('Document request not found');

    return apiResponse(docRequest, HttpStatus.OK);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    const { id } = await params;
    const reqId = parseInt(id);

    const contentType = request.headers.get('content-type') || '';
    let dataToUpdate: any = {};
    let files: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const status = formData.get('status') as string;
      const admin_comment = formData.get('admin_comment') as string;

      if (status) dataToUpdate.status = status;
      if (admin_comment) dataToUpdate.admin_comment = admin_comment;

      // Extract files sent with key 'files' (supports multiple)
      const fileEntries = formData.getAll('files');
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          files.push(entry);
        }
      }
    } else {
      const body = await request.json();
      const { status, admin_comment, attachment } = body;
      // Filter undefined
      if (status !== undefined) dataToUpdate.status = status;
      if (admin_comment !== undefined) dataToUpdate.admin_comment = admin_comment;
      if (attachment !== undefined) dataToUpdate.attachment = attachment;
    }

    const updated = await prisma.documentRequest.update({
      where: { id: reqId },
      data: dataToUpdate,
    });

    // Save and link new files
    if (files.length > 0) {
      for (const file of files) {
        const path = await saveFile(file, 'documents');
        await prisma.documentRequestAttachment.create({
          data: {
            document_request_id: reqId,
            file_name: file.name,
            file_path: path || '',
            file_size: file.size,
            file_type: file.type
          }
        });
      }
    }

    return apiResponse(updated, HttpStatus.OK);
  } catch (error) {
    console.error('Update doc request error:', error);
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) throw APIError.unauthorized();

    const { id } = await params;

    await prisma.documentRequest.delete({
      where: { id: parseInt(id) }
    });

    return apiResponse({ message: 'Deleted successfully' }, HttpStatus.OK);
  } catch (error) {
    return apiError(error);
  }
}
