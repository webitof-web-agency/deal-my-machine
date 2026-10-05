type UploadRequestOrigin = {
  protocol: string;
  host: string;
};

export const getAbsoluteUploadUrl = (origin: UploadRequestOrigin, fileUrl: string) => {
  const normalizedFileUrl = fileUrl.trim();

  if (/^https?:\/\//i.test(normalizedFileUrl) || !origin.host.trim()) {
    return normalizedFileUrl;
  }

  return `${origin.protocol}://${origin.host}${normalizedFileUrl.startsWith('/') ? normalizedFileUrl : `/${normalizedFileUrl}`}`;
};
