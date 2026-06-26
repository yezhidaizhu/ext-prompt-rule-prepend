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

function resolveInputSelectorCandidates(stored?: string, preset?: string) {
  return [...new Set(
    [stored?.trim(), preset?.trim()].filter((item): item is string => Boolean(item)),
  )];
}

export function useContentPlatform(platformId: string): ContentPlatform {
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  const preset = platformPresets.find((item) => item.id === platformId);
  const platformConfig = computed(() => config.value.platforms.find((item) => item.id === platformId));

  const inputSelectorCandidates = computed(() =>
    resolveInputSelectorCandidates(
      platformConfig.value?.textareaSelector,
      preset?.inputSelector,
    ));

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
      for (const selector of inputSelectorCandidates.value) {
        const input = findInputBySelectors(selector);
        if (input) return input;
      }

      return null;
    },
    findInputFromTarget(target: EventTarget | null) {
      for (const selector of inputSelectorCandidates.value) {
        const input = findInputFromTarget(target, selector);
        if (input) return input;
      }

      return null;
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
