import { platformPresets, type PlatformPreset } from '@/config/platforms';

function matchPattern(pattern: string, url: string) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(`^${escaped}$`).test(url);
}

export function getCurrentPlatformPreset(): PlatformPreset | null {
  return platformPresets.find((preset) =>
    preset.matches.some((match) => matchPattern(match, location.href))) ?? null;
}

export { platformPresets };
