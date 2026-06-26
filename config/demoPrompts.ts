import type { PopupRule } from '@/types/promptConfig';

const demoPlatformIds = ['deepseek', 'chatgpt'];

export interface DemoPromptDefinition extends PopupRule {
  /** 初始化时作为对应平台的 defaultRuleId */
  defaultForPlatform?: string;
}

/**
 * 内置示例规则。仅用于默认配置，用户可在 Popup 中自由增删改。
 */
export const demoPromptDefinitions: DemoPromptDefinition[] = [
  {
    id: 'deepseek-no-fluff',
    content: 'Be concise and direct: do not restate the question, do not open with filler like "Sure" or "Of course", and skip unrelated setup or closing summaries. Use one sentence when one sentence is enough; use bullets only when they help.',
    enabled: true,
    platformIds: demoPlatformIds,
    defaultForPlatform: 'deepseek',
  },
  {
    id: 'chatgpt-structured',
    content: 'Answer with clear structure: address the core question first, then add detail. Use short headings and lists when useful. Avoid long intros and repeating the user\'s question.',
    enabled: true,
    platformIds: demoPlatformIds,
    defaultForPlatform: 'chatgpt',
  },

  // Claude 暂不支持，后续启用时可取消注释：
  // {
  //   id: 'claude-prose-concise',
  //   content: 'Keep answers tight: short paragraphs, no redundant phrasing. For technical questions, prefer verifiable steps or code.',
  //   enabled: true,
  //   platformIds: ['claude'],
  //   defaultForPlatform: 'claude',
  // },
];

export function createDemoPromptRules(): PopupRule[] {
  return demoPromptDefinitions.map(({ defaultForPlatform: _, ...rule }) => rule);
}

export function getDemoDefaultRuleId(platformId: string) {
  return demoPromptDefinitions.find((item) => item.defaultForPlatform === platformId)?.id ?? '';
}

export const demoDefaultSelectedRuleId = demoPromptDefinitions.find((item) => item.defaultForPlatform)?.id ?? '';
