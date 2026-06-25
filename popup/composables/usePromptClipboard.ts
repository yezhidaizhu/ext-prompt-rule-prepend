import { useClipboard } from '@vueuse/core';

export function usePromptClipboard() {
  const { copy } = useClipboard({ legacy: true });

  async function copyText(text: string) {
    if (!text) return false;

    if (!navigator.clipboard?.writeText) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      return await verifyClipboard(text);
    } catch {
      // Fall back below.
    }

    try {
      await copy(text);
      return await verifyClipboard(text);
    } catch {
      return false;
    }
  }

  async function verifyClipboard(expected: string) {
    if (!navigator.clipboard?.readText) return true;

    try {
      return (await navigator.clipboard.readText()) === expected;
    } catch {
      return true;
    }
  }

  return {
    copyText,
  };
}
