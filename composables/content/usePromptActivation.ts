import { usePromptConfigStore } from '@/stores/promptConfigStore';
import {
  getActiveRuleFromConfig,
  type PromptConfig,
} from '@/utils/promptConfig';
import type { TriggerVisibility } from '@/types/promptConfig';
import { isVisibleElement } from '@/utils/content/domInput';
import type { ContentPlatform } from './types';

function getPlatformConfig(config: PromptConfig, platformId: string) {
  return config.platforms.find((item) => item.id === platformId);
}

function shouldShowToggle(
  platform: ContentPlatform,
  config: PromptConfig,
  inputVisible: boolean,
): boolean {
  const platformConfig = getPlatformConfig(config, platform.id);
  if (!platformConfig?.enabled || !inputVisible) return false;

  const visibility: TriggerVisibility = config.settings.triggerVisibility;
  if (visibility === 'hidden') return false;
  if (visibility === 'always') return true;

  return !platform.hasConversationStarted();
}

export function getPromptActivationState(
  platform: ContentPlatform,
  config: PromptConfig = usePromptConfigStore().config,
) {
  const platformConfig = getPlatformConfig(config, platform.id);
  const input = platform.findInput();
  const inputVisible = Boolean(input && isVisibleElement(input));
  const platformEnabled = Boolean(platformConfig?.enabled);

  const toggleVisible = shouldShowToggle(platform, config, inputVisible);
  const activeRuleContent = platformEnabled && config.enabled
    ? getActiveRuleFromConfig(config, platform.id)
    : '';
  const canInject = Boolean(activeRuleContent);

  return {
    toggleVisible,
    canInject,
    activeRule: activeRuleContent,
    input,
    offsetX: platformConfig?.offsetX ?? 0,
    offsetY: platformConfig?.offsetY ?? 0,
  };
}
