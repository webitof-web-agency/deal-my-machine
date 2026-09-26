export const getReceiptPreviewMode = (fileUrl, event = 'initial') => {
  if (event === 'error' || /\.pdf(?:$|[?#])/i.test(fileUrl || '')) {
    return 'document';
  }

  return 'image';
};
