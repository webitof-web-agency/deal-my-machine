const DRIVE_RECEIPT_URL_PATTERN = /^https:\/\/drive\.google\.com\/uc\?id=[A-Za-z0-9_-]{10,}$/;
const LEGACY_LOCAL_RECEIPT_URL_PATTERN = /^\/uploads\/public\//;

export const isDriveReceiptUrl = (value: string) => DRIVE_RECEIPT_URL_PATTERN.test(value);

export const isAcceptedReceiptUrl = (value: string) =>
  isDriveReceiptUrl(value) || LEGACY_LOCAL_RECEIPT_URL_PATTERN.test(value);
