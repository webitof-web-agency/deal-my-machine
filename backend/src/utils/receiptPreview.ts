const DRIVE_RECEIPT_URL_PATTERN = /^https:\/\/drive\.google\.com\/uc\?id=([A-Za-z0-9_-]{10,})$/i;

export const getReceiptDriveFileId = (value: string) => value.match(DRIVE_RECEIPT_URL_PATTERN)?.[1] || null;

export const toReceiptProxyUrl = (fileId: string) =>
  `/api/documents/receipt/drive/${encodeURIComponent(fileId)}`;
