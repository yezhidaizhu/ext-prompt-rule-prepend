import { defaultPromptRule } from '@/config/platforms';

export const promptRuleStorageKey = 'prompt-rule-prepend:state';

export const promptRuleOptions = [
  defaultPromptRule,
  '先给结论，再补充必要依据。',
  '不确定时直接说明，不要编造。',
];

export interface PromptRuleState {
  enabled: boolean;
  selectedRule: string;
}

export function getDefaultPromptRuleState(): PromptRuleState {
  return {
    enabled: false,
    selectedRule: promptRuleOptions[0],
  };
}

export function readPromptRuleState(storage: Storage = localStorage): PromptRuleState {
  const fallback = getDefaultPromptRuleState();
  const raw = storage.getItem(promptRuleStorageKey);

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<PromptRuleState>;
    const selectedRule = typeof parsed.selectedRule === 'string' && parsed.selectedRule.trim()
      ? parsed.selectedRule
      : fallback.selectedRule;

    return {
      enabled: Boolean(parsed.enabled),
      selectedRule,
    };
  } catch {
    storage.removeItem(promptRuleStorageKey);
    return fallback;
  }
}

export function writePromptRuleState(state: PromptRuleState, storage: Storage = localStorage) {
  storage.setItem(promptRuleStorageKey, JSON.stringify(state));
}

export function getActivePromptRule() {
  const state = readPromptRuleState();
  if (!state.enabled) return '';

  return state.selectedRule.trim() || promptRuleOptions[0];
}
