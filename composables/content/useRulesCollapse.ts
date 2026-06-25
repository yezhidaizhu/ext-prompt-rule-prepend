import { onMounted, onUnmounted } from 'vue';
import { observeRulesCollapse } from '@/utils/content/rulesCollapse';
import type { ContentPlatform } from './types';

export function useRulesCollapse(platform: ContentPlatform) {
  let cleanup = () => {};

  onMounted(() => {
    cleanup = observeRulesCollapse(() => platform.getConversationSelectors());
  });

  onUnmounted(() => {
    cleanup();
  });
}
