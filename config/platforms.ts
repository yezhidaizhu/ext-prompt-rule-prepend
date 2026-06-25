export type InsertStrategy = 'append-before-send' | 'visible-folded-rule';

export interface PlatformPreset {
  id: string;
  name: string;
  matches: string[];
  inputSelector: string;
  submitSelector: string;
  conversationContainerSelector: string;
  conversationItemSelector: string;
  triggerOffsetX: number;
  triggerOffsetY: number;
  insertStrategy: InsertStrategy;
}

export const platformPresets: PlatformPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    matches: ['*://chat.deepseek.com/*'],
    inputSelector: 'textarea',
    submitSelector: 'button[type="submit"]',
    conversationContainerSelector: '.ds-virtual-list--printable',
    conversationItemSelector: '.ds-message',
    triggerOffsetX: -28,
    triggerOffsetY: 10,
    insertStrategy: 'append-before-send',
  },
];

export const defaultPromptRule =
  '请用简洁、准确、结构化的方式回答，避免无关铺垫。';
