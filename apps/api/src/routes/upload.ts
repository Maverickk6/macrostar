import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, uploadMultipleFiles } from '../lib/upload.js';

const uploadRouter = new Hono();

// POST /api/upload - Upload single image
uploadRouter.post('/', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'macrostar';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const imageUrl = await uploadFile(file, folder);
    return c.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// POST /api/upload/multiple - Upload multiple images
uploadRouter.post('/multiple', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const folder = (formData.get('folder') as string) || 'macrostar';
    
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('files') && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    const imageUrls = await uploadMultipleFiles(files, folder);
    return c.json({ success: true, urls: imageUrls });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

export default uploadRouter;
