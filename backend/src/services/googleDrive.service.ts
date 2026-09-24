import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { publicUploadDir } from '../utils/documentUpload';

/**
 * Compatibility service for the existing upload controller contract.
 * Files are stored on the configured application disk until an external
 * document provider is intentionally enabled.
 */
export const uploadFileToDrive = async (
  buffer: Buffer,
  mimeType: string,
  originalName: string,
) => {
  const extension = path.extname(originalName).toLowerCase() || '.bin';
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const directory = path.join(publicUploadDir, 'documents');
  const filePath = path.join(directory, fileName);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    fileId: fileName,
    viewLink: `/uploads/public/documents/${encodeURIComponent(fileName)}`,
    mimeType,
  };
};
