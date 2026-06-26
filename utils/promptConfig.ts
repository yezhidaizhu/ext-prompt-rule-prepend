import type { PopupPlatform, PopupRule, PopupTheme } from '@/types/promptConfig';

export const promptConfigStorageKey = 'prompt-rule-prepend:config';
export const promptConfigUpdatedEvent = 'prompt-rule-prepend:config-updated';

export interface PromptConfig {
  enabled: boolean;
  selectedRuleId: string;
  rules: PopupRule[];
  platforms: PopupPlatform[];
  settings: {
    showTriggerButton: boolean;
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
      defaultRuleId: 'concise',
      matchUrl: '*://chat.deepseek.com/*',
      textareaSelector: 'textarea',
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
      defaultRuleId: '',
      matchUrl: '*://chatgpt.com/*',
      textareaSelector: 'textarea',
      submitSelector: 'button[data-testid="send-button"]',
      conversationContainerSelector: 'main',
      conversationItemSelector: '',
      offsetX: -34,
      offsetY: 8,
    },
    {
      id: 'claude',
      name: 'Claude',
      enabled: false,
      defaultRuleId: '',
      matchUrl: '*://claude.ai/*',
      textareaSelector: 'div[contenteditable="true"]',
      submitSelector: 'button[aria-label*="Send"]',
      conversationContainerSelector: 'main',
      conversationItemSelector: '',
      offsetX: -34,
      offsetY: 8,
    },
  ];

  const rules: PopupRule[] = [
    {
      id: 'concise',
      content: '请用简洁、准确的语言回答，避免无关铺垫。',
      enabled: true,
      platformIds: ['deepseek', 'chatgpt'],
    },
    {
      id: 'conclusion-first',
      content: '先给结论，再补充必要依据。',
      enabled: true,
      platformIds: ['deepseek'],
    },
    {
      id: 'no-fabrication',
      content: '不确定时直接说明，不要编造。',
      enabled: false,
      platformIds: ['claude', 'chatgpt'],
    },
    {
      id: 'long-demo',
      content: '这是一个很长很长的规则示例，用来验证列表、查看抽屉、删除确认弹窗里的长文本省略效果：请始终先理解用户真实意图，再用简洁准确的方式回答；如果问题存在歧义，请指出关键不确定点；如果需要步骤，请只给必要步骤；不要输出无关铺垫、不要重复用户问题、不要编造不存在的事实。',
      enabled: true,
      platformIds: ['deepseek', 'chatgpt', 'claude'],
    },
  ];

  return {
    enabled: false,
    selectedRuleId: 'concise',
    rules,
    platforms,
    settings: {
      showTriggerButton: true,
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

function mergeStoredConfig(stored: PromptConfig | null): PromptConfig {
  if (!stored) return createDefaultPromptConfig();

  const defaults = createDefaultPromptConfig();
  const platforms = Array.isArray(stored.platforms)
    ? stored.platforms.map((platform) => {
      const defaultPlatform = defaults.platforms.find((item) => item.id === platform.id);

      return {
        ...defaultPlatform,
        ...platform,
        conversationContainerSelector: platform.conversationContainerSelector
          || defaultPlatform?.conversationContainerSelector
          || '',
        conversationItemSelector: platform.conversationItemSelector
          || defaultPlatform?.conversationItemSelector
          || '',
      };
    })
    : defaults.platforms;

  return {
    ...defaults,
    ...stored,
    rules: Array.isArray(stored.rules) ? stored.rules : defaults.rules,
    platforms,
    settings: {
      ...defaults.settings,
      ...(stored.settings || {}),
    },
  };
}

export function loadPromptConfigSync(): PromptConfig {
  return mergeStoredConfig(readLocalStorageValue<PromptConfig>(promptConfigStorageKey));
}

export async function loadPromptConfig(): Promise<PromptConfig> {
  const stored = await readFromStorage<PromptConfig>(promptConfigStorageKey);
  return mergeStoredConfig(stored);
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

export function findPlatformRule(config: PromptConfig, platformId?: string) {
  const platform = platformId
    ? config.platforms.find((item) => item.id === platformId && item.enabled)
    : null;

  if (platformId && !platform) {
    return null;
  }

  const preferredRuleIds = [
    platform?.defaultRuleId,
    config.selectedRuleId,
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
