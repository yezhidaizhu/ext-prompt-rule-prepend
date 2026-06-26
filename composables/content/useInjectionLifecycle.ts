import { onMounted, onUnmounted } from 'vue';
import { throttle } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import type { ContentPlatform } from './types';

const CONVERSATION_THROTTLE_MS = 120;

export function useInjectionLifecycle(platform: ContentPlatform) {
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  let lastConversationStarted = platform.hasConversationStarted();
  let observer: MutationObserver | null = null;

  function enableInjection() {
    if (config.value.enabled) return;

    config.value.enabled = true;
    void store.persist();
  }

  function disableInjection() {
    if (!config.value.enabled) return;

    config.value.enabled = false;
    void store.persist();
  }

  function syncConversationState() {
    const started = platform.hasConversationStarted();

    if (lastConversationStarted && !started) {
      enableInjection();
    } else if (!lastConversationStarted && started) {
      disableInjection();
    }

    lastConversationStarted = started;
  }

  const throttledSyncConversationState = throttle(syncConversationState, CONVERSATION_THROTTLE_MS, {
    leading: true,
    trailing: true,
  });

  onMounted(() => {
    if (lastConversationStarted) {
      disableInjection();
    } else {
      enableInjection();
    }

    observer = new MutationObserver(throttledSyncConversationState);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  });

  onUnmounted(() => {
    throttledSyncConversationState.cancel();
    observer?.disconnect();
  });

  return {
    disableInjection,
  };
}
