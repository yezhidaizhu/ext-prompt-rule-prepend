import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { platformPresets } from '@/config/platforms';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import {
  findInputBySelectors,
  findInputFromTarget,
  findSubmitBySelectors,
  hasConversationContent,
} from '@/utils/content/platformDom';
import type { ContentPlatform } from './types';

export function useContentPlatform(platformId: string): ContentPlatform {
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  const preset = platformPresets.find((item) => item.id === platformId);
  const platformConfig = computed(() => config.value.platforms.find((item) => item.id === platformId));

  const inputSelector = computed(() =>
    platformConfig.value?.textareaSelector || preset?.inputSelector || 'textarea');

  const submitSelector = computed(() =>
    platformConfig.value?.submitSelector || preset?.submitSelector || 'button[type="submit"]');

  const conversationContainerSelector = computed(() =>
    platformConfig.value?.conversationContainerSelector
    || preset?.conversationContainerSelector
    || '');

  const conversationItemSelector = computed(() =>
    platformConfig.value?.conversationItemSelector
    || preset?.conversationItemSelector
    || '');

  return {
    id: platformId,
    findInput() {
      return findInputBySelectors(inputSelector.value);
    },
    findInputFromTarget(target: EventTarget | null) {
      return findInputFromTarget(target, inputSelector.value);
    },
    findSubmit() {
      return findSubmitBySelectors(submitSelector.value, this.findInput());
    },
    hasConversationStarted() {
      return hasConversationContent(
        conversationContainerSelector.value,
        conversationItemSelector.value,
      );
    },
    getConversationSelectors() {
      return {
        containerSelector: conversationContainerSelector.value,
        itemSelector: conversationItemSelector.value,
      };
    },
  };
}
