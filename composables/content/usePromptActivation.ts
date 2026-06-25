import { usePromptConfigStore } from '@/stores/promptConfigStore';
import {
  getActiveRuleFromConfig,
  type PromptConfig,
} from '@/utils/promptConfig';
import { isVisibleElement } from '@/utils/content/domInput';
import type { ContentPlatform } from './types';

function getPlatformConfig(config: PromptConfig, platformId: string) {
  return config.platforms.find((item) => item.id === platformId);
}

export function getPromptActivationState(
  platform: ContentPlatform,
  config: PromptConfig = usePromptConfigStore().config,
) {
  const platformConfig = getPlatformConfig(config, platform.id);
  const input = platform.findInput();
  const inputVisible = Boolean(input && isVisibleElement(input));

  const toggleVisible =
    Boolean(platformConfig?.enabled)
    && config.settings.showTriggerButton
    && !platform.hasConversationStarted()
    && inputVisible;

  const activeRule = toggleVisible && config.enabled
    ? getActiveRuleFromConfig(config, platform.id)
    : '';

  return {
    toggleVisible,
    canInject: Boolean(activeRule),
    activeRule,
    input,
    offsetX: platformConfig?.offsetX ?? 0,
    offsetY: platformConfig?.offsetY ?? 0,
  };
}
