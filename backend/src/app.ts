import express, { Application, Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { publicUploadDirectories } from './utils/documentUpload';
import { getPersistedPublicBrandingAsset } from './utils/appSettings';

dotenv.config();

const app: Application = express();

const allowedCorsOrigins = new Set(
  (
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,https://dealmymachine.com,https://www.dealmymachine.com,https://admin.dealmymachine.com'
  )
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedCorsOrigins.has(origin.replace(/\/+$/, ''))) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve branding images (hero, logo, certification) stored on the server's
// public upload directory. These are written to disk by the upload handlers
// and fetched directly by the frontend — no Drive dependency needed.
for (const publicUploadDirectory of publicUploadDirectories) {
  app.use('/uploads/public', express.static(publicUploadDirectory));
}
// Branding uploads are also persisted in the platform settings record so they
// remain available after a deployment replaces the application filesystem.
app.use('/uploads/public', async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  if (!/^\/(?:finance-support|hero-image|inspection-section|site-logo|site-dark-logo|site-footer-logo|site-favicon|site-manifest-icon)\//.test(req.path)) {
    return next();
  }

  try {
    const fileUrl = `/uploads/public${req.path}`;
    const asset = await getPersistedPublicBrandingAsset(fileUrl);

    if (!asset) {
      return next();
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(asset.base64, 'base64'));
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api', apiRoutes);

// Basic Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'JCB Exchange API is running' });
});

// Default Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload.',
    });
  }

  if (
    err.message.includes('Only JPG, PNG, WEBP, and PDF files are allowed.') ||
    err.message.includes('Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are allowed.') ||
    err.message.includes('PDF files must be 3MB or smaller.') ||
    err.message.includes('Image files must be 5MB or smaller.') ||
    err.message.includes('Video files must be 15MB or smaller.') ||
    err.message.includes('File too large')
  ) {
    return res.status(400).json({ success: false, error: err.message });
  }

  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    return res.status(404).json({ success: false, error: 'Requested file was not found.' });
  }

  if ((err as Error & { statusCode?: number }).statusCode) {
    return res.status((err as Error & { statusCode: number }).statusCode).json({
      success: false,
      error: err.message,
      code: (err as Error & { code?: string }).code,
    });
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export default app;
