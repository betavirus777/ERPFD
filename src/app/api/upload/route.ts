import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { uploadToAzure, getAzureFileUrl, isAzureConfigured } from '@/lib/storage';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST - Upload file
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const formData = await request.formData();
      const file = formData.get('uploadFile') as File | null;
      const uploadPath = formData.get('uploadPath') as string | null;

      if (!file) {
        return NextResponse.json(
          { success: false, code: 400, error: 'No file provided' },
          { status: 400 }
        );
      }

      if (!uploadPath) {
        return NextResponse.json(
          { success: false, code: 400, error: 'Upload path is required' },
          { status: 400 }
        );
      }

      // Get file buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Try Azure Storage first
      if (isAzureConfigured()) {
        const result = await uploadToAzure(
          buffer,
          file.name,
          uploadPath,
          file.type
        );

        if (result.success && result.path) {
          return NextResponse.json({
            success: true,
            code: 200,
            data: {
              path: result.path,
              fullUrl: result.url,
              fileName: file.name,
            },
            message: 'File uploaded successfully.',
          });
        }
      }

      // Fallback to local storage
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.name);
      const baseName = path.basename(file.name, ext);
      const uniqueFileName = `${baseName}_${timestamp}_${random}${ext}`;
      
      const localPath = path.join(process.cwd(), 'public', 'uploads', uploadPath);
      const filePath = path.join(localPath, uniqueFileName);

      // Ensure directory exists
      await mkdir(localPath, { recursive: true });

      // Write file
      await writeFile(filePath, buffer);

      const relativePath = `${uploadPath}/${uniqueFileName}`;
      const fullUrl = `/uploads/${relativePath}`;

      return NextResponse.json({
        success: true,
        code: 200,
        data: {
          path: relativePath,
          fullUrl,
          fileName: file.name,
        },
        message: 'File uploaded successfully.',
      });
    } catch (error) {
      console.error('File upload error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  });
}

// GET - Get file URL
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const filePath = searchParams.get('path');

      if (!filePath) {
        return NextResponse.json(
          { success: false, code: 400, error: 'File path is required' },
          { status: 400 }
        );
      }

      const url = getAzureFileUrl(filePath);

      return NextResponse.json({
        success: true,
        code: 200,
        data: { url },
      });
    } catch (error) {
      console.error('Get file URL error:', error);
      return NextResponse.json(
        { success: false, code: 500, error: 'Failed to get file URL' },
        { status: 500 }
      );
    }
  });
}

