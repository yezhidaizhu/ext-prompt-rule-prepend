import { onMounted, onUnmounted, ref, watch } from 'vue';
import { throttle } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import { getPromptActivationState } from './usePromptActivation';
import type { ContentPlatform } from './types';

const POSITION_THROTTLE_MS = 32;

export function useTogglePosition(platform: ContentPlatform) {
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  const hostStyle = ref<Record<string, string>>({
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '2147483647',
    pointerEvents: 'auto',
    display: 'none',
    transform: 'translate(0px, 0px)',
  });

  const toggleVisible = ref(false);

  function updatePosition() {
    const state = getPromptActivationState(platform);
    toggleVisible.value = state.toggleVisible;

    if (!state.toggleVisible || !state.input) {
      hostStyle.value = {
        ...hostStyle.value,
        display: 'none',
      };
      return;
    }

    const rect = state.input.getBoundingClientRect();
    hostStyle.value = {
      ...hostStyle.value,
      display: 'block',
      transform: `translate(${Math.round(rect.left + state.offsetX)}px, ${Math.round(rect.top + state.offsetY)}px)`,
    };
  }

  const throttledUpdatePosition = throttle(updatePosition, POSITION_THROTTLE_MS, {
    leading: true,
    trailing: true,
  });

  let observer: MutationObserver | null = null;

  onMounted(() => {
    observer = new MutationObserver(throttledUpdatePosition);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.addEventListener('resize', throttledUpdatePosition);
    window.addEventListener('scroll', throttledUpdatePosition, true);
    watch(config, updatePosition, { deep: true });
    updatePosition();
  });

  onUnmounted(() => {
    throttledUpdatePosition.cancel();
    observer?.disconnect();
    window.removeEventListener('resize', throttledUpdatePosition);
    window.removeEventListener('scroll', throttledUpdatePosition, true);
  });

  return {
    hostStyle,
    toggleVisible,
  };
}
