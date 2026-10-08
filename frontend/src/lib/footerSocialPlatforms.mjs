export const FOOTER_SOCIAL_PLATFORMS = Object.freeze([
  { id: 'FACEBOOK', label: 'Facebook', icon: 'facebook' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: 'instagram' },
  { id: 'TWITTER', label: 'X/Twitter', icon: 'twitter' },
  { id: 'LINKEDIN', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'YOUTUBE', label: 'YouTube', icon: 'youtube' },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: 'whatsapp' },
  { id: 'TELEGRAM', label: 'Telegram', icon: 'telegram' },
  { id: 'TIKTOK', label: 'TikTok', icon: 'tiktok' },
  { id: 'SNAPCHAT', label: 'Snapchat', icon: 'snapchat' },
  { id: 'PINTEREST', label: 'Pinterest', icon: 'pinterest' },
  { id: 'REDDIT', label: 'Reddit', icon: 'reddit' },
  { id: 'DISCORD', label: 'Discord', icon: 'discord' },
  { id: 'GITHUB', label: 'GitHub', icon: 'github' },
  { id: 'THREADS', label: 'Threads', icon: 'threads' },
  { id: 'VK', label: 'VK', icon: 'vk' },
]);

const SUPPORTED_PLATFORM_IDS = new Set(FOOTER_SOCIAL_PLATFORMS.map((platform) => platform.id));

export const getVisibleFooterSocialLinks = (items = []) => {
  const seenPlatforms = new Set();

  return [...items]
    .filter((item) => {
      const platform = String(item.platform || '').toUpperCase();
      if (!SUPPORTED_PLATFORM_IDS.has(platform) || seenPlatforms.has(platform)) {
        return false;
      }

      seenPlatforms.add(platform);
      return Boolean(item.url);
    })
    .sort((left, right) => Number(left.displayOrder || 0) - Number(right.displayOrder || 0));
};
