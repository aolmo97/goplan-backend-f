import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/authenticate';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'planmate', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('No result from Cloudinary'));
          resolve(result);
        }
      );
      stream.on('error', reject);
      stream.end(req.file!.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err?.message || err);
    res.status(500).json({ error: 'Upload failed', detail: err?.message });
  }
});

export default router;
