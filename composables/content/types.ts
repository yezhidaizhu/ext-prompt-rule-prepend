import type { PromptInputElement } from '@/utils/content/domInput';

export interface ContentPlatform {
  id: string;
  findInput(): PromptInputElement | null;
  findInputFromTarget(target: EventTarget | null): PromptInputElement | null;
  findSubmit(): HTMLElement | null;
  hasConversationStarted(): boolean;
  getConversationSelectors(): {
    containerSelector: string;
    itemSelector: string;
  };
}
