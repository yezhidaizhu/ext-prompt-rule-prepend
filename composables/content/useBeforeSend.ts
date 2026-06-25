import { onMounted, onUnmounted } from 'vue';
import {
  buildAppendedPrompt,
  containsOrEquals,
  readInputValue,
  writeInputValue,
} from '@/utils/content/domInput';
import { getPromptActivationState } from './usePromptActivation';
import type { ContentPlatform } from './types';

export function useBeforeSend(platform: ContentPlatform) {
  function applyPromptBeforeSend() {
    const { canInject, activeRule, input } = getPromptActivationState(platform);
    if (!canInject || !activeRule || !input) return false;

    const currentValue = readInputValue(input);
    const nextValue = buildAppendedPrompt(activeRule, currentValue);
    if (nextValue === currentValue) return false;

    writeInputValue(input, nextValue);
    return true;
  }

  function handleClick(event: MouseEvent) {
    const submit = platform.findSubmit();
    if (!submit || !containsOrEquals(submit, event.target)) return;

    applyPromptBeforeSend();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.isComposing || event.keyCode === 229) return;

    const input = platform.findInputFromTarget(event.target) || platform.findInput();
    if (!input) return;

    applyPromptBeforeSend();
  }

  onMounted(() => {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown, true);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeydown, true);
  });
}
