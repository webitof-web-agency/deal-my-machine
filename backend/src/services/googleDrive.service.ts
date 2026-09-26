import { Readable } from 'stream';
import path from 'path';
import { randomUUID } from 'crypto';
import { google, drive_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import { publicUploadDir } from '../utils/documentUpload';
import { getAppSettings } from '../utils/appSettings';
import { isDriveReceiptUrl } from '../utils/receiptUrl';

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const IST_TIME_ZONE = 'Asia/Kolkata';
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

type DriveUploadResult = { fileId: string; viewLink: string };

export const getFolderNames = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const monthNumber = parts.find((part) => part.type === 'month')?.value || '01';
  const monthName = new Intl.DateTimeFormat('en-US', { timeZone: IST_TIME_ZONE, month: 'long' }).format(date);
  return { year, month: `${monthNumber}-${monthName}` };
};

const escapeDriveQuery = (value: string) => value.replace(/'/g, "\\'");

const rangeError = () => {
  const error = new Error('Requested media range is not satisfiable.') as Error & { statusCode?: number };
  error.statusCode = 416;
  return error;
};

export const parseDriveRange = (range: string | undefined, size: number) => {
  if (!range) {
    return { start: 0, end: Math.max(size - 1, 0) };
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || size <= 0 || (!match[1] && !match[2])) {
    throw rangeError();
  }

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) throw rangeError();
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
      throw rangeError();
    }
    end = Math.min(end, size - 1);
  }

  return { start, end };
};

export const toDrivePublicUrl = (fileId: string, useOwnedListingProxy = false) =>
  useOwnedListingProxy
    ? `/api/documents/upload/public/listing-media/drive/${encodeURIComponent(fileId)}`
    : `https://drive.google.com/uc?id=${encodeURIComponent(fileId)}`;

const getDriveClient = async () => {
  const settings = (await getAppSettings()).googleDrive;
  if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) {
    return null;
  }

  const auth = new google.auth.OAuth2(settings.clientId, settings.clientSecret);
  auth.setCredentials({ refresh_token: settings.refreshToken });
  return { drive: google.drive({ version: 'v3', auth }), settings };
};

const findOrCreateFolder = async (drive: drive_v3.Drive, parentId: string, name: string) => {
  const query = [
    `'${escapeDriveQuery(parentId)}' in parents`,
    `name = '${escapeDriveQuery(name)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME}'`,
    'trashed = false',
  ].join(' and ');
  const existing = await drive.files.list({ q: query, fields: 'files(id,name,mimeType,trashed,capabilities)', pageSize: 100 });
  const folder = existing.data.files?.find((file) => file.id && file.mimeType === DRIVE_FOLDER_MIME && file.trashed !== true);
  if (folder?.id) return folder.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] },
    fields: 'id',
  });
  if (!created.data.id) throw new Error(`Unable to create Drive folder ${name}.`);
  return created.data.id;
};

const validateWritableFolder = async (drive: drive_v3.Drive, folderId: string, label: string) => {
  const folder = await drive.files.get({ fileId: folderId, fields: 'id,name,mimeType,trashed,capabilities' });
  if (!folder.data.id || folder.data.mimeType !== DRIVE_FOLDER_MIME || folder.data.trashed === true) {
    throw new Error(`Configured ${label} is not an active Google Drive folder.`);
  }
  if (folder.data.capabilities?.canAddChildren === false) {
    throw new Error(`Configured ${label} is not writable.`);
  }
  return folder;
};

const uploadToDrive = async (
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  access: 'public' | 'private',
  useOwnedListingProxy = false,
) => {
  const client = await getDriveClient();
  if (!client || !client.settings.enabled) return null;
  const rootId = access === 'public' ? client.settings.mediaRootFolderId : (client.settings.backupRootFolderId || client.settings.mediaRootFolderId);
  if (!rootId) throw new Error('Google Drive media root folder is not configured.');

  await validateWritableFolder(client.drive, rootId, access === 'public' ? 'public media root folder' : 'private/backup root folder');
  const { year, month } = getFolderNames();
  const yearFolderId = await findOrCreateFolder(client.drive, rootId, year);
  const monthFolderId = await findOrCreateFolder(client.drive, yearFolderId, month);
  const extension = path.extname(originalName).toLowerCase() || '.bin';
  const name = `media-${randomUUID()}${extension}`;
  const uploaded = await client.drive.files.create({
    requestBody: { name, parents: [monthFolderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,name,mimeType,size,parents',
  });
  const fileId = uploaded.data.id;
  if (!fileId) throw new Error('Google Drive did not return a file ID.');
  if (!uploaded.data.parents?.includes(monthFolderId)) {
    throw new Error('Google Drive returned an unexpected upload parent.');
  }

  if (access === 'public') {
    await client.drive.permissions.create({ fileId, requestBody: { type: 'anyone', role: 'reader' } });
  }

  return { fileId, viewLink: access === 'public' ? toDrivePublicUrl(fileId, useOwnedListingProxy) : '' };
};

export const assertDriveReceiptUpload = (remote: DriveUploadResult | null): DriveUploadResult => {
  if (!remote?.fileId || !remote.viewLink || !isDriveReceiptUrl(remote.viewLink)) {
    const error = new Error('Google Drive is required for payment receipt uploads. Configure and enable Drive before uploading a receipt.') as Error & {
      code?: string;
      statusCode?: number;
    };
    error.code = 'DRIVE_STORAGE_UNAVAILABLE';
    error.statusCode = 503;
    throw error;
  }

  return remote;
};

export const uploadReceiptFileToDrive = async (buffer: Buffer, mimeType: string, originalName: string) => {
  const remote = await uploadToDrive(buffer, mimeType, originalName, 'public');
  return assertDriveReceiptUpload(remote);
};

export const uploadFileToDrive = async (buffer: Buffer, mimeType: string, originalName: string, options?: { useOwnedListingProxy?: boolean }) => {
  const remote = await uploadToDrive(buffer, mimeType, originalName, 'public', options?.useOwnedListingProxy === true);
  if (remote) return remote;

  const extension = path.extname(originalName).toLowerCase() || '.bin';
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const directory = path.join(publicUploadDir, 'documents');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, fileName), buffer);
  return { fileId: fileName, viewLink: `/uploads/public/documents/${encodeURIComponent(fileName)}` };
};

export const uploadPrivateFileToDrive = async (buffer: Buffer, mimeType: string, originalName: string) => {
  const remote = await uploadToDrive(buffer, mimeType, originalName, 'private');
  if (!remote) return null;
  return { fileId: `drive-${remote.fileId}`, viewLink: `/api/documents/secure/${encodeURIComponent(`drive-${remote.fileId}`)}` };
};

export const getDriveMediaStream = async (fileId: string, range?: string) => {
  if (!DRIVE_ID_PATTERN.test(fileId)) throw new Error('Invalid Drive file ID.');
  const client = await getDriveClient();
  if (!client) throw new Error('Google Drive is not configured.');
  const metadata = await client.drive.files.get({ fileId, fields: 'id,mimeType,size,name' });
  const size = Number(metadata.data.size || 0);
  const { start, end } = parseDriveRange(range, size);
  const response = await client.drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream', headers: range ? { Range: `bytes=${start}-${end}` } : undefined } as any,
  ) as { data: NodeJS.ReadableStream };
  return { stream: response.data, mimeType: metadata.data.mimeType || 'application/octet-stream', size, start, end };
};

export const deleteDriveFile = async (fileId: string) => {
  const client = await getDriveClient();
  if (!client || !DRIVE_ID_PATTERN.test(fileId)) return;
  await client.drive.files.delete({ fileId });
};

export const testDriveConnection = async () => {
  const client = await getDriveClient();
  if (!client || !client.settings.enabled) throw new Error('Google Drive is not enabled or credentials are incomplete.');
  const rootId = client.settings.mediaRootFolderId;
  if (!rootId) throw new Error('Public media root folder is not configured.');
  const folder = await validateWritableFolder(client.drive, rootId, 'public media root folder');
  let backupFolderName: string | undefined;
  if (client.settings.backupRootFolderId && client.settings.backupRootFolderId !== rootId) {
    const backupFolder = await validateWritableFolder(client.drive, client.settings.backupRootFolderId, 'private/backup root folder');
    backupFolderName = backupFolder.data.name || client.settings.backupRootFolderId;
  }
  return { folderName: folder.data.name || rootId, ...(backupFolderName ? { backupFolderName } : {}) };
};

export const extractDriveFileId = (value: string) => {
  const match = value.match(/(?:[?&]id=|\/d\/|\/drive\/|drive\/)([A-Za-z0-9_-]{10,})/);
  return match?.[1] || (DRIVE_ID_PATTERN.test(value) ? value : null);
};
