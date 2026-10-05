import { randomUUID } from 'crypto';

export type HappyCustomerItem = {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
  updatedAt: string | null;
  updatedByUserId: string | null;
};

const HAPPY_CUSTOMER_DRIVE_PROXY_PREFIX = '/api/documents/upload/public/happy-customers/drive/';

export const getHappyCustomerDriveProxyUrl = (fileId: string) =>
  `${HAPPY_CUSTOMER_DRIVE_PROXY_PREFIX}${encodeURIComponent(fileId)}`;

export const normalizeHappyCustomerImageUrl = (imageUrl: string) => {
  const trimmed = imageUrl.trim();

  if (trimmed.startsWith(HAPPY_CUSTOMER_DRIVE_PROXY_PREFIX)) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (!/(^|\.)drive\.google\.com$/i.test(parsed.hostname)) return trimmed;

    const fileId = parsed.searchParams.get('id') || parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1];
    return fileId && /^[A-Za-z0-9_-]{10,}$/.test(fileId) ? getHappyCustomerDriveProxyUrl(fileId) : trimmed;
  } catch {
    return trimmed;
  }
};

export const normalizeHappyCustomerItems = (
  items?: Partial<HappyCustomerItem>[] | null,
): HappyCustomerItem[] => {
  const normalizedItems: HappyCustomerItem[] = [];

  for (const [index, item] of (items || []).entries()) {
    const name = item.name?.trim();
    const imageUrl = item.imageUrl ? normalizeHappyCustomerImageUrl(item.imageUrl) : undefined;

    if (!name || !imageUrl) continue;

    normalizedItems.push({
      id: item.id?.trim() || randomUUID(),
      name,
      imageUrl,
      displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : index,
      updatedAt: item.updatedAt || null,
      updatedByUserId: item.updatedByUserId || null,
    });
  }

  return normalizedItems
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((item, index) => ({ ...item, displayOrder: index }));
};
