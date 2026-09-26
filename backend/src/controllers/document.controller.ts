import { NextFunction, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import {
  getSecureDocumentUrl,
  MAX_FINANCE_SUPPORT_IMAGE_UPLOAD_SIZE,
  MAX_HERO_IMAGE_UPLOAD_SIZE,
  MAX_INSPECTION_SECTION_IMAGE_UPLOAD_SIZE,
  MAX_SITE_LOGO_IMAGE_UPLOAD_SIZE,
  MAX_SITE_FAVICON_IMAGE_UPLOAD_SIZE,
  MAX_SITE_MANIFEST_ICON_IMAGE_UPLOAD_SIZE,
  isPdfMimeType,
  isVideoMimeType,
  MAX_DOCUMENT_UPLOAD_SIZE,
  MAX_LISTING_VIDEO_UPLOAD_SIZE,
  secureUploadDir,
  publicUploadDir,
} from '../utils/documentUpload';
import { getDriveMediaStream, toDrivePublicUrl, uploadFileToDrive, uploadPrivateFileToDrive, uploadReceiptFileToDrive } from '../services/googleDrive.service';
import { randomUUID } from 'crypto';
import { persistPublicBrandingAsset } from '../utils/appSettings';

/**
 * Save a branding image buffer to the server's public upload directory.
 * Returns the URL path that can be served by the /uploads/public static route.
 */
const saveBrandingImageToDisk = async (
  file: Express.Multer.File,
  subfolder: string
): Promise<string> => {
  const ext = path.extname(file.originalname).toLowerCase() || '.webp';
  const timestamp = Date.now();
  const uid = randomUUID();
  const fileName = `${timestamp}-${uid}${ext}`;
  const targetDir = path.join(publicUploadDir, subfolder);
  const targetPath = path.join(targetDir, fileName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, file.buffer);
  await persistPublicBrandingAsset(`/uploads/public/${subfolder}/${fileName}`, file.buffer, file.mimetype);

  return `/uploads/public/${subfolder}/${fileName}`;
};

const prismaAny = prisma as any;

const getApiOrigin = (req: Request) => `${req.protocol}://${req.get('host')}`;

const getUploadedFile = (req: Request) => req.file;

const cleanupFile = async (filePath?: string) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup failures for already-missing temp files.
  }
};

const saveSecureFile = async (file: Express.Multer.File) => {
  const remote = await uploadPrivateFileToDrive(file.buffer, file.mimetype, file.originalname);
  if (remote) return remote;
  const extension = path.extname(file.originalname).toLowerCase() || '.bin';
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const targetPath = path.join(secureUploadDir, fileName);

  await fs.mkdir(secureUploadDir, { recursive: true });
  await fs.writeFile(targetPath, file.buffer);

  return { fileId: fileName, viewLink: getSecureDocumentUrl(fileName) };
};

const enforceStoredFileSizePolicy = async (
  file: Express.Multer.File,
  purpose: 'document' | 'listing-media' | 'finance-support' | 'hero-image' | 'inspection-section' | 'site-logo' | 'site-dark-logo' | 'site-footer-logo' | 'site-favicon' | 'site-manifest-icon' = 'document'
) => {
  if (isPdfMimeType(file.mimetype) && file.size > 3 * 1024 * 1024) {
    await cleanupFile(file.path);
    throw new Error('PDF files must be 3MB or smaller.');
  }

  if (purpose === 'document' && !isPdfMimeType(file.mimetype) && file.size > MAX_DOCUMENT_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Image files must be 5MB or smaller.');
  }

  if (purpose === 'listing-media') {
    if (isVideoMimeType(file.mimetype) && file.size > MAX_LISTING_VIDEO_UPLOAD_SIZE) {
      await cleanupFile(file.path);
      throw new Error('Video files must be 15MB or smaller.');
    }

    if (!isVideoMimeType(file.mimetype) && file.size > MAX_DOCUMENT_UPLOAD_SIZE) {
      await cleanupFile(file.path);
      throw new Error('Image files must be 5MB or smaller.');
    }
  }

  if (purpose === 'finance-support' && file.size > MAX_FINANCE_SUPPORT_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Finance support logo image must be 2MB or smaller.');
  }

  if (purpose === 'hero-image' && file.size > MAX_HERO_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Hero image must be 5MB or smaller.');
  }

  if (purpose === 'inspection-section' && file.size > MAX_INSPECTION_SECTION_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Inspection section image must be 5MB or smaller.');
  }

  if (purpose === 'site-logo' && file.size > MAX_SITE_LOGO_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Site logo image must be 2MB or smaller.');
  }

  if (purpose === 'site-dark-logo' && file.size > MAX_SITE_LOGO_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Dark logo image must be 2MB or smaller.');
  }

  if (purpose === 'site-footer-logo' && file.size > MAX_SITE_LOGO_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Site footer logo image must be 2MB or smaller.');
  }

  if (purpose === 'site-favicon' && file.size > MAX_SITE_FAVICON_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Favicon image must be 512KB or smaller.');
  }

  if (purpose === 'site-manifest-icon' && file.size > MAX_SITE_MANIFEST_ICON_IMAGE_UPLOAD_SIZE) {
    await cleanupFile(file.path);
    throw new Error('Manifest icon image must be 1MB or smaller.');
  }
};

const getSafeFileName = (fileName: string) => path.basename(fileName);

const isSecureDocumentOwner = async (userId: string, fileUrl: string) => {
  const matchingDocument = await prismaAny.kycDocument.findFirst({
    where: {
      fileUrl,
      partnerProfile: {
        userId,
      },
    },
    select: { id: true },
  });

  if (matchingDocument) {
    return true;
  }

  return false;
};

const secureDocumentExists = async (fileUrl: string) => {
  const [kycDocument, candidateDocument] = await Promise.all([
    prismaAny.kycDocument.findFirst({
      where: { fileUrl },
      select: { id: true },
    }),
    prismaAny.candidateDocument.findFirst({
      where: { fileUrl },
      select: { id: true },
    }),
  ]);

  return Boolean(kycDocument || candidateDocument);
};

const buildUploadResponse = (
  req: Request,
  file: Express.Multer.File,
  visibility: 'public' | 'secure',
  fileUrl: string,
  fileName: string
) => {
  return {
    message: 'File uploaded successfully.',
    file: {
      access: visibility,
      fileName: fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileUrl,
      absoluteUrl: fileUrl, // Drive URL is already absolute
    },
  };
};

export const uploadSecureDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'document');
    
    const { fileId, viewLink } = await saveSecureFile(file);
    
    res.status(201).json(buildUploadResponse(req, file, 'secure', viewLink, fileId));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'document');
    
    // Upload to Google Drive (Public)
    const { fileId, viewLink } = await uploadFileToDrive(file.buffer, file.mimetype, file.originalname);
    
    res.status(201).json(buildUploadResponse(req, file, 'public', viewLink, fileId));
  } catch (error) {
    next(error);
  }
};

export const uploadCustomerPrimeReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Prime receipt upload is available for customers only.' });
    }

    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A receipt file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'document');
    const { fileId, viewLink } = await uploadReceiptFileToDrive(file.buffer, file.mimetype, file.originalname);
    res.status(201).json(buildUploadResponse(req, file, 'public', viewLink, fileId));
  } catch (error) {
    next(error);
  }
};

export const uploadListingPaymentReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Listing payment receipt upload is available for customers only.' });
    }

    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A receipt file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'document');
    const { fileId, viewLink } = await uploadReceiptFileToDrive(file.buffer, file.mimetype, file.originalname);
    res.status(201).json(buildUploadResponse(req, file, 'public', viewLink, fileId));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicListingMedia = async (req: Request, res: Response, next: NextFunction) => {
  const file = getUploadedFile(req);

  try {
    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'listing-media');

    const { fileId, viewLink } = await uploadFileToDrive(file.buffer, file.mimetype, file.originalname, { useOwnedListingProxy: true });
    res.status(201).json(buildUploadResponse(req, file, 'public', viewLink, fileId));

  } catch (error) {
    await cleanupFile(file?.path);
    next(error);
  }
};

export const uploadPublicFinanceSupportImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'finance-support');
    const localPath = await saveBrandingImageToDisk(file, 'finance-support');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicHeroImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'hero-image');
    const localPath = await saveBrandingImageToDisk(file, 'hero-image');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicInspectionSectionImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'inspection-section');
    const localPath = await saveBrandingImageToDisk(file, 'inspection-section');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicSiteLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'site-logo');
    const localPath = await saveBrandingImageToDisk(file, 'site-logo');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicSiteDarkLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'site-dark-logo');
    const localPath = await saveBrandingImageToDisk(file, 'site-dark-logo');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const getPublicDriveListingMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = String(req.params.fileId || '');
    if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
      return res.status(400).json({ error: 'Invalid Drive file ID.' });
    }

    // A public proxy must only expose Drive files that this application owns
    // through a public listing-media record. This prevents the endpoint from
    // becoming an arbitrary Google Drive file proxy.
    const mediaRecord = await (prisma as any).media.findFirst({
      where: {
        OR: [
          { url: `/api/documents/upload/public/listing-media/drive/${fileId}` },
        ],
      },
      select: {
        type: true,
        listing: {
          select: {
            status: true,
            partner: {
              select: { role: true, status: true, partnerProfile: { select: { onboardingStatus: true, accountStatus: true, kycStatus: true } } },
            },
          },
        },
      },
    });
    if (!mediaRecord || !['IMAGE', 'VIDEO'].includes(String(mediaRecord.type || '').toUpperCase()) || !mediaRecord.listing) {
      return res.status(404).json({ error: 'Media not found.' });
    }

    const media = await getDriveMediaStream(fileId, req.headers.range);
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (req.headers.range) {
      const contentLength = Math.max(media.end - media.start + 1, 0);
      res.status(206);
      res.setHeader('Content-Length', String(contentLength));
      res.setHeader('Content-Range', `bytes ${media.start}-${media.end}/${media.size}`);
    } else if (media.size > 0) {
      res.setHeader('Content-Length', String(media.size));
    }
    media.stream.on('error', next);
    media.stream.pipe(res);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 416) {
      return res.status(416).setHeader('Content-Range', 'bytes */*').end();
    }
    next(error);
  }
};

export const getReceiptDriveFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = String(req.params.fileId || '');
    if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
      return res.status(400).json({ error: 'Invalid Drive file ID.' });
    }

    const receiptUrl = toDrivePublicUrl(fileId);
    const [primeReceipt, listingReceipt] = await Promise.all([
      prismaAny.customerPrimeSubscription.findFirst({
        where: { receiptUrl },
        select: { id: true },
      }),
      prismaAny.listingPaymentSubmission.findFirst({
        where: { receiptUrl },
        select: { id: true },
      }),
    ]);

    if (!primeReceipt && !listingReceipt) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }

    const media = await getDriveMediaStream(fileId, req.headers.range);
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');
    if (req.headers.range) {
      res.status(206);
      res.setHeader('Content-Length', String(Math.max(media.end - media.start + 1, 0)));
      res.setHeader('Content-Range', `bytes ${media.start}-${media.end}/${media.size}`);
    } else if (media.size > 0) {
      res.setHeader('Content-Length', String(media.size));
    }
    media.stream.on('error', next);
    media.stream.pipe(res);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 416) {
      return res.status(416).setHeader('Content-Range', 'bytes */*').end();
    }
    next(error);
  }
};

export const uploadPublicSiteFooterLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'site-footer-logo');
    const localPath = await saveBrandingImageToDisk(file, 'site-footer-logo');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicSiteFaviconImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'site-favicon');
    const localPath = await saveBrandingImageToDisk(file, 'site-favicon');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const uploadPublicSiteManifestIconImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({ error: 'A file is required.' });
    }

    await enforceStoredFileSizePolicy(file, 'site-manifest-icon');
    const localPath = await saveBrandingImageToDisk(file, 'site-manifest-icon');
    res.status(201).json(buildUploadResponse(req, file, 'public', localPath, path.basename(localPath)));
  } catch (error) {
    next(error);
  }
};

export const getSecureDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const fileName = getSafeFileName(String(req.params.filename || ''));
    if (!fileName) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }

    const fileUrl = getSecureDocumentUrl(fileName);
    const fileExistsInRecords = await secureDocumentExists(fileUrl);

    if (!fileExistsInRecords) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const isStaffOperator = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(req.user.role);
    const hasAccess = isStaffOperator || (await isSecureDocumentOwner(req.user.id, fileUrl));

    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this document.' });
    }

    if (fileName.startsWith('drive-')) {
      const driveFileId = fileName.slice('drive-'.length);
      const media = await getDriveMediaStream(driveFileId, req.headers.range);
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (req.headers.range) {
        res.status(206);
        res.setHeader('Content-Length', String(Math.max(media.end - media.start + 1, 0)));
        res.setHeader('Content-Range', `bytes ${media.start}-${media.end}/${media.size}`);
      } else if (media.size > 0) {
        res.setHeader('Content-Length', String(media.size));
      }
      media.stream.on('error', next);
      media.stream.pipe(res);
      return;
    }

    const absolutePath = path.join(secureUploadDir, fileName);
    await fs.access(absolutePath);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(absolutePath);
  } catch (error) {
    next(error);
  }
};
