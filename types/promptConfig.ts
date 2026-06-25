export interface PopupRule {
  id: string;
  content: string;
  enabled: boolean;
  platformIds: string[];
}

export interface PopupPlatform {
  id: string;
  name: string;
  enabled: boolean;
  defaultRuleId: string;
  matchUrl: string;
  textareaSelector: string;
  submitSelector: string;
  conversationContainerSelector: string;
  conversationItemSelector: string;
  offsetX: number;
  offsetY: number;
}

export type PopupTheme = 'auto' | 'black' | 'white';
