import { onMounted, onUnmounted, ref, watch } from 'vue';
import { throttle } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import { isCreateDialogOpen } from '@/utils/content/dialogPortal';
import { layerZIndex } from '@/utils/content/layerZIndex';
import { getPromptActivationState } from './usePromptActivation';
import type { ContentPlatform } from './types';

const POSITION_THROTTLE_MS = 32;
const CREATE_DIALOG_CLOSED_EVENT = 'prompt-rule-prepend:create-dialog-closed';

export function useTogglePosition(platform: ContentPlatform) {
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  let lastTransform = 'translate(0px, 0px)';

  const hostStyle = ref<Record<string, string>>({
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: String(layerZIndex.toggle),
    pointerEvents: 'auto',
    display: 'none',
    transform: lastTransform,
  });

  function showHostAt(transform: string) {
    lastTransform = transform;
    hostStyle.value = {
      ...hostStyle.value,
      display: 'block',
      transform,
    };
  }

  function hideHost() {
    hostStyle.value = {
      ...hostStyle.value,
      display: 'none',
    };
  }

  function updatePosition() {
    if (isCreateDialogOpen()) {
      if (hostStyle.value.display !== 'none') {
        hostStyle.value = {
          ...hostStyle.value,
          display: 'block',
          transform: lastTransform,
        };
      }
      return;
    }

    const state = getPromptActivationState(platform);

    if (!state.toggleVisible || !state.input) {
      hideHost();
      return;
    }

    const rect = state.input.getBoundingClientRect();
    showHostAt(
      `translate(${Math.round(rect.left + state.offsetX)}px, ${Math.round(rect.top + state.offsetY)}px)`,
    );
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
    window.addEventListener(CREATE_DIALOG_CLOSED_EVENT, updatePosition);
    watch(config, updatePosition, { deep: true });
    updatePosition();
  });

  onUnmounted(() => {
    throttledUpdatePosition.cancel();
    observer?.disconnect();
    window.removeEventListener('resize', throttledUpdatePosition);
    window.removeEventListener('scroll', throttledUpdatePosition, true);
    window.removeEventListener(CREATE_DIALOG_CLOSED_EVENT, updatePosition);
  });

  return {
    hostStyle,
  };
}
