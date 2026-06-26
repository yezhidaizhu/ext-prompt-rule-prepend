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

/** DeepSeek 主输入框（实测 class 含 ds-scroll-area） */
export const deepseekInputSelector = 'textarea.ds-scroll-area';

/** ChatGPT 主输入框（contenteditable，非 textarea；常见 id 为 prompt-textarea） */
export const chatgptInputSelector = '#prompt-textarea';

/** ChatGPT 对话消息（用于判断「仅新对话」是否显示三角） */
export const chatgptConversationItemSelector =
  '[data-message-author-role="user"], [data-message-author-role="assistant"]';

export const platformPresets: PlatformPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    matches: ['*://chat.deepseek.com/*'],
    inputSelector: deepseekInputSelector,
    submitSelector: 'button[type="submit"]',
    conversationContainerSelector: '.ds-virtual-list--printable',
    conversationItemSelector: '.ds-message',
    triggerOffsetX: -28,
    triggerOffsetY: 10,
    insertStrategy: 'append-before-send',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    matches: ['*://chatgpt.com/*'],
    inputSelector: chatgptInputSelector,
    submitSelector: 'button[data-testid="send-button"]',
    conversationContainerSelector: 'main',
    conversationItemSelector: chatgptConversationItemSelector,
    triggerOffsetX: -84,
    triggerOffsetY: 0,
    insertStrategy: 'append-before-send',
  },
];

export const defaultPromptRule =
  '请用简洁、准确、结构化的方式回答，避免无关铺垫。';
