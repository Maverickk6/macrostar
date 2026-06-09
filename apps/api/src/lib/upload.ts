import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from root directory (for local development)
// In production (Vercel), environment variables are automatically injected
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');
const envPath = path.join(rootDir, '.env');

if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env:', result.error);
  }
}

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(file: File, folder: string = 'macrostar'): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}`,
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadMultipleFiles(files: File[], folder: string = 'macrostar'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file, folder));
  return Promise.all(uploadPromises);
}

export async function deleteFile(publicUrl: string): Promise<void> {
  try {
    const publicId = publicUrl.split('/').pop()?.split('.')[0];
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete file');
  }
}
