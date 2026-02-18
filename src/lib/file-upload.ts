import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function saveFile(file: File, folder: string): Promise<string | null> {
    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return relative path for DB
        return `/uploads/${folder}/${filename}`;
    } catch (error) {
        console.error('File save error:', error);
        return null;
    }
}
