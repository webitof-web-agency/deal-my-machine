export const FOOTER_SOCIAL_PLATFORMS = [
  { id: 'FACEBOOK', label: 'Facebook' },
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'TWITTER', label: 'X/Twitter' },
  { id: 'LINKEDIN', label: 'LinkedIn' },
  { id: 'YOUTUBE', label: 'YouTube' },
  { id: 'WHATSAPP', label: 'WhatsApp' },
  { id: 'TELEGRAM', label: 'Telegram' },
  { id: 'TIKTOK', label: 'TikTok' },
  { id: 'SNAPCHAT', label: 'Snapchat' },
  { id: 'PINTEREST', label: 'Pinterest' },
  { id: 'REDDIT', label: 'Reddit' },
  { id: 'DISCORD', label: 'Discord' },
  { id: 'GITHUB', label: 'GitHub' },
  { id: 'THREADS', label: 'Threads' },
  { id: 'VK', label: 'VK' },
] as const;

export const SUPPORTED_FOOTER_SOCIAL_PLATFORM_IDS = new Set<string>(
  FOOTER_SOCIAL_PLATFORMS.map((platform) => platform.id),
);

export type SupportedFooterSocialPlatform = (typeof FOOTER_SOCIAL_PLATFORMS)[number]['id'];

export const dedupeFooterSocialPlatforms = <T extends { platform?: string | null }>(items: T[]): T[] => {
  const seenPlatforms = new Set<string>();

  return items.filter((item) => {
    const platform = item.platform?.trim().toUpperCase();
    if (!platform || !SUPPORTED_FOOTER_SOCIAL_PLATFORM_IDS.has(platform) || seenPlatforms.has(platform)) {
      return false;
    }

    seenPlatforms.add(platform);
    return true;
  });
};
