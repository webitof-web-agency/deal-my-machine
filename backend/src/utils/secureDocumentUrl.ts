export const getSecureDocumentUrl = (fileName: string) =>
  `/api/documents/secure/${encodeURIComponent(fileName)}`;
