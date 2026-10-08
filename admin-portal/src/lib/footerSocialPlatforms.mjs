export const FOOTER_SOCIAL_PLATFORMS = Object.freeze([
  { id: 'FACEBOOK', name: 'Facebook', icon: 'facebook' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: 'instagram' },
  { id: 'TWITTER', name: 'X/Twitter', icon: 'twitter' },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: 'linkedin' },
  { id: 'YOUTUBE', name: 'YouTube', icon: 'youtube' },
  { id: 'WHATSAPP', name: 'WhatsApp', icon: 'whatsapp' },
  { id: 'TELEGRAM', name: 'Telegram', icon: 'telegram' },
  { id: 'TIKTOK', name: 'TikTok', icon: 'tiktok' },
  { id: 'SNAPCHAT', name: 'Snapchat', icon: 'snapchat' },
  { id: 'PINTEREST', name: 'Pinterest', icon: 'pinterest' },
  { id: 'REDDIT', name: 'Reddit', icon: 'reddit' },
  { id: 'DISCORD', name: 'Discord', icon: 'discord' },
  { id: 'GITHUB', name: 'GitHub', icon: 'github' },
  { id: 'THREADS', name: 'Threads', icon: 'threads' },
  { id: 'VK', name: 'VK', icon: 'vk' },
]);

export const getAvailableFooterSocialPlatforms = (selectedPlatforms = [], currentPlatform = '') => {
  const selected = new Set(selectedPlatforms.map((platform) => String(platform).toUpperCase()));
  const current = String(currentPlatform).toUpperCase();

  return FOOTER_SOCIAL_PLATFORMS.filter((platform) => platform.id === current || !selected.has(platform.id));
};
