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
const INPUT_RETRY_MS = 400;
const INPUT_RETRY_DURATION_MS = 30000;

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
      if (import.meta.env.DEV) {
        console.debug('[prompt-rule-prepend] toggle hidden', {
          platform: platform.id,
          toggleVisible: state.toggleVisible,
          hasInput: Boolean(state.input),
          triggerVisibility: config.value.settings.triggerVisibility,
          platformEnabled: config.value.platforms.find((item) => item.id === platform.id)?.enabled,
          conversationStarted: platform.hasConversationStarted(),
        });
      }
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
  let retryTimer: number | null = null;
  let retryStartedAt = 0;

  function ensureInputRetryLoop() {
    if (retryTimer !== null) return;

    retryStartedAt = Date.now();
    retryTimer = window.setInterval(() => {
      updatePosition();

      if (Date.now() - retryStartedAt >= INPUT_RETRY_DURATION_MS && retryTimer !== null) {
        window.clearInterval(retryTimer);
        retryTimer = null;
      }
    }, INPUT_RETRY_MS);
  }

  onMounted(() => {
    ensureInputRetryLoop();
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
    if (retryTimer !== null) {
      window.clearInterval(retryTimer);
      retryTimer = null;
    }
    observer?.disconnect();
    window.removeEventListener('resize', throttledUpdatePosition);
    window.removeEventListener('scroll', throttledUpdatePosition, true);
    window.removeEventListener(CREATE_DIALOG_CLOSED_EVENT, updatePosition);
  });

  return {
    hostStyle,
  };
}
