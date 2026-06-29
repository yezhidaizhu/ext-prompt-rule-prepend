import type { PopupLanguage, PopupPlatform, PopupRule, PopupTheme, TriggerVisibility } from '@/types/promptConfig';
import {
  createDemoPromptRules,
  getDemoDefaultRuleId,
  demoDefaultSelectedRuleId,
} from '@/config/demoPrompts';
import {
  chatgptConversationItemSelector,
  chatgptInputSelector,
  deepseekInputSelector,
  kimiConversationItemSelector,
  kimiInputSelector,
} from '@/config/platforms';

export const promptConfigStorageKey = 'prompt-rule-prepend:config';
export const promptConfigUpdatedEvent = 'prompt-rule-prepend:config-updated';

export interface PromptConfig {
  enabled: boolean;
  selectedRuleId: string;
  rules: PopupRule[];
  platforms: PopupPlatform[];
  settings: {
    language: PopupLanguage;
    triggerVisibility: TriggerVisibility;
    uiTheme: PopupTheme;
  };
}

function cloneConfig(config: PromptConfig): PromptConfig {
  return JSON.parse(JSON.stringify(config)) as PromptConfig;
}

export { cloneConfig };

export function createDefaultPromptConfig(): PromptConfig {
  const platforms: PopupPlatform[] = [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      enabled: true,
      defaultRuleId: getDemoDefaultRuleId('deepseek'),
      matchUrl: '*://chat.deepseek.com/*',
      textareaSelector: deepseekInputSelector,
      submitSelector: 'button[type="submit"]',
      conversationContainerSelector: '.ds-virtual-list--printable',
      conversationItemSelector: '.ds-message',
      offsetX: -28,
      offsetY: 10,
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      enabled: true,
      defaultRuleId: getDemoDefaultRuleId('chatgpt'),
      matchUrl: '*://chatgpt.com/*',
      textareaSelector: chatgptInputSelector,
      submitSelector: 'button[data-testid="send-button"]',
      conversationContainerSelector: 'main',
      conversationItemSelector: chatgptConversationItemSelector,
      offsetX: -84,
      offsetY: 0,
    },
    {
      id: 'kimi',
      name: 'Kimi',
      enabled: true,
      defaultRuleId: getDemoDefaultRuleId('deepseek'),
      matchUrl: '*://www.kimi.com/*',
      textareaSelector: kimiInputSelector,
      submitSelector: '.send-button-container:not(.disabled)',
      conversationContainerSelector: '#chat-container',
      conversationItemSelector: kimiConversationItemSelector,
      offsetX: -46,
      offsetY: 0,
    },
    // Claude 暂不支持，后续启用时在 config/demoPrompts.ts 一并取消注释：
    // {
    //   id: 'claude',
    //   name: 'Claude',
    //   enabled: false,
    //   defaultRuleId: getDemoDefaultRuleId('claude'),
    //   matchUrl: '*://claude.ai/*',
    //   textareaSelector: 'div[contenteditable="true"]',
    //   submitSelector: 'button[aria-label*="Send"]',
    //   conversationContainerSelector: 'main',
    //   conversationItemSelector: '',
    //   offsetX: -34,
    //   offsetY: 8,
    // },
  ];

  const rules = createDemoPromptRules();

  return {
    enabled: false,
    selectedRuleId: demoDefaultSelectedRuleId,
    rules,
    platforms,
    settings: {
      language: 'en',
      triggerVisibility: 'newConversationOnly',
      uiTheme: 'auto',
    },
  };
}

interface ExtensionStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(value: Record<string, unknown>): Promise<void>;
}

interface ExtensionStorageChange {
  newValue?: unknown;
}

interface ExtensionGlobal {
  browser?: {
    runtime?: {
      id?: string;
    };
    storage?: {
      local?: ExtensionStorageArea;
      onChanged?: {
        addListener(listener: (changes: Record<string, ExtensionStorageChange>, areaName: string) => void): void;
        removeListener(listener: (changes: Record<string, ExtensionStorageChange>, areaName: string) => void): void;
      };
    };
  };
  chrome?: {
    runtime?: {
      id?: string;
    };
    storage?: {
      local?: ExtensionStorageArea;
      onChanged?: {
        addListener(listener: (changes: Record<string, ExtensionStorageChange>, areaName: string) => void): void;
        removeListener(listener: (changes: Record<string, ExtensionStorageChange>, areaName: string) => void): void;
      };
    };
  };
}

function getStorage(): ExtensionStorageArea | undefined {
  const extensionGlobal = globalThis as typeof globalThis & ExtensionGlobal;
  return extensionGlobal.browser?.storage?.local ?? extensionGlobal.chrome?.storage?.local;
}

function getStorageChangedEvent() {
  const extensionGlobal = globalThis as typeof globalThis & ExtensionGlobal;
  return extensionGlobal.browser?.storage?.onChanged ?? extensionGlobal.chrome?.storage?.onChanged;
}

function readLocalStorageValue<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writeLocalStorageValue<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or access errors in page storage.
  }
}

export function isExtensionContextValid() {
  try {
    const extensionGlobal = globalThis as typeof globalThis & ExtensionGlobal;
    const runtime = extensionGlobal.browser?.runtime ?? extensionGlobal.chrome?.runtime;
    return Boolean(runtime?.id);
  } catch {
    return false;
  }
}

async function readFromStorage<T>(key: string): Promise<T | null> {
  const localValue = readLocalStorageValue<T>(key);

  const storage = getStorage();
  if (!storage || !isExtensionContextValid()) {
    return localValue;
  }

  try {
    const result = await storage.get(key);
    const extensionValue = (result as Record<string, T | undefined>)[key] ?? null;
    if (extensionValue !== null) {
      writeLocalStorageValue(key, extensionValue);
      return extensionValue;
    }

    return localValue;
  } catch {
    return localValue;
  }
}

async function writeToStorage<T>(key: string, value: T) {
  writeLocalStorageValue(key, value);

  const storage = getStorage();
  if (!storage || !isExtensionContextValid()) {
    return;
  }

  try {
    await storage.set({ [key]: value } as Record<string, T>);
  } catch {
    // Extension context invalidated; localStorage mirror remains available.
  }
}

function mergeSettings(
  storedSettings: Partial<PromptConfig['settings']> & { showTriggerButton?: boolean } | undefined,
  defaults: PromptConfig['settings'],
): PromptConfig['settings'] {
  const raw = storedSettings || {};
  const uiTheme = raw.uiTheme ?? defaults.uiTheme;
  const language = raw.language === 'en'
    || raw.language === 'ja'
    || raw.language === 'ko'
    || raw.language === 'zh'
    ? raw.language
    : defaults.language;

  if (raw.triggerVisibility === 'hidden'
    || raw.triggerVisibility === 'newConversationOnly'
    || raw.triggerVisibility === 'always') {
    return {
      language,
      uiTheme,
      triggerVisibility: raw.triggerVisibility,
    };
  }

  return {
    language,
    uiTheme,
    triggerVisibility: raw.showTriggerButton === false ? 'hidden' : 'newConversationOnly',
  };
}

function mergePlatformConfig(
  platform: PopupPlatform,
  defaultPlatform: PopupPlatform | undefined,
): PopupPlatform {
  const merged = {
    ...defaultPlatform,
    ...platform,
    conversationContainerSelector: platform.conversationContainerSelector
      || defaultPlatform?.conversationContainerSelector
      || '',
    conversationItemSelector: platform.conversationItemSelector
      || defaultPlatform?.conversationItemSelector
      || '',
  };

  if (platform.id === 'kimi' && defaultPlatform) {
    const staleKimiItemSelector = '.chat-message, [data-message-id]';
    if (platform.conversationItemSelector === staleKimiItemSelector) {
      merged.conversationItemSelector = defaultPlatform.conversationItemSelector;
    }
  }

  return merged;
}

function mergeStoredConfig(stored: PromptConfig | null): PromptConfig {
  if (!stored) return createDefaultPromptConfig();

  const defaults = createDefaultPromptConfig();
  const storedPlatforms = Array.isArray(stored.platforms)
    ? stored.platforms
    : defaults.platforms;
  const platforms = [
    ...storedPlatforms.map((platform) => {
      const defaultPlatform = defaults.platforms.find((item) => item.id === platform.id);

      return mergePlatformConfig(platform, defaultPlatform);
    }),
    ...defaults.platforms.filter((platform) =>
      !storedPlatforms.some((storedPlatform) => storedPlatform.id === platform.id)),
  ];

  const storedRules = Array.isArray(stored.rules) ? stored.rules : defaults.rules;
  const rules = [
    ...storedRules,
    ...defaults.rules.filter((rule) =>
      !storedRules.some((storedRule) => storedRule.id === rule.id)),
  ];

  return {
    ...defaults,
    ...stored,
    rules,
    platforms,
    settings: mergeSettings(
      stored.settings as Partial<PromptConfig['settings']> & { showTriggerButton?: boolean } | undefined,
      defaults.settings,
    ),
  };
}

export function loadPromptConfigSync(): PromptConfig {
  return mergeStoredConfig(readLocalStorageValue<PromptConfig>(promptConfigStorageKey));
}

export async function loadPromptConfig(): Promise<PromptConfig> {
  const stored = await readFromStorage<PromptConfig>(promptConfigStorageKey);
  return mergeStoredConfig(stored);
}

export async function resetPromptConfig(): Promise<PromptConfig> {
  const config = createDefaultPromptConfig();
  await writeToStorage(promptConfigStorageKey, config);
  emitPromptConfigUpdated(config);
  return config;
}

export async function savePromptConfig(config: PromptConfig) {
  const nextConfig = cloneConfig(config);
  await writeToStorage(promptConfigStorageKey, nextConfig);
  emitPromptConfigUpdated(nextConfig);
}

export function emitPromptConfigUpdated(config: PromptConfig) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(promptConfigUpdatedEvent, {
    detail: cloneConfig(config),
  }));
}

export function observePromptConfigChanges(listener: (config: PromptConfig) => void) {
  const onChanged = getStorageChangedEvent();
  if (!onChanged || !isExtensionContextValid()) return () => {};

  const handleStorageChanged = (
    changes: Record<string, ExtensionStorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'local') return;

    const change = changes[promptConfigStorageKey];
    if (!change) return;

    const config = change.newValue
      ? mergeStoredConfig(change.newValue as PromptConfig)
      : createDefaultPromptConfig();
    writeLocalStorageValue(promptConfigStorageKey, config);
    listener(config);
    emitPromptConfigUpdated(config);
  };

  onChanged.addListener(handleStorageChanged);
  return () => onChanged.removeListener(handleStorageChanged);
}

export function createRuleForPlatform(
  config: PromptConfig,
  platformId: string,
  content: string,
  options: {
    enabled?: boolean;
    select?: boolean;
  } = {},
) {
  const trimmed = content.trim();
  if (!trimmed) return '';

  const id = `rule-${Date.now()}`;
  config.rules.unshift({
    id,
    content: trimmed,
    enabled: options.enabled ?? true,
    platformIds: [platformId],
  });

  if (options.select !== false) {
    config.selectedRuleId = id;
  }

  return id;
}

export function updateRule(
  config: PromptConfig,
  ruleId: string,
  updates: {
    content?: string;
    enabled?: boolean;
  },
) {
  const rule = config.rules.find((item) => item.id === ruleId);
  if (!rule) return false;

  if (updates.content !== undefined) {
    const trimmed = updates.content.trim();
    if (!trimmed) return false;
    rule.content = trimmed;
  }

  if (updates.enabled !== undefined) {
    rule.enabled = updates.enabled;
  }

  return true;
}

export function findPlatformRule(config: PromptConfig, platformId?: string) {
  const platform = platformId
    ? config.platforms.find((item) => item.id === platformId && item.enabled)
    : null;

  if (platformId && !platform) {
    return null;
  }

  // 1. 页面列表里用户当前选中的规则
  // 2. 平台设置里的默认规则（选中项对该平台无效时的回退）
  // 3. 该平台下第一条可用规则
  const preferredRuleIds = [
    config.selectedRuleId,
    platform?.defaultRuleId,
  ].filter((value): value is string => Boolean(value));

  for (const ruleId of preferredRuleIds) {
    const matchedRule = config.rules.find((item) =>
      item.id === ruleId
      && item.enabled
      && item.content.trim()
      && (!platformId || item.platformIds.includes(platformId)));

    if (matchedRule) {
      return matchedRule;
    }
  }

  return config.rules.find((item) =>
    item.enabled
    && item.content.trim()
    && (!platformId || item.platformIds.includes(platformId))) ?? null;
}

export function resolveActiveRule(config: PromptConfig, platformId?: string) {
  if (!config.enabled) return null;
  return findPlatformRule(config, platformId);
}

export function getActiveRuleFromConfig(config: PromptConfig, platformId?: string) {
  return resolveActiveRule(config, platformId)?.content.trim() || '';
}
