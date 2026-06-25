import { isVisibleElement, type PromptInputElement } from './domInput';

const submitFallbackSelectors = [
  'button[aria-label*="发送"]',
  'button[aria-label*="Send" i]',
  'button[data-testid*="send" i]',
  '[role="button"][aria-label*="发送"]',
  '[role="button"][aria-label*="Send" i]',
];

export function queryVisible<T extends Element>(selectors: string[]) {
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll<T>(selector)];
    const visible = elements.reverse().find(isVisibleElement);
    if (visible) return visible;
  }

  return null;
}

export function isEditableInput(element: Element | null): element is PromptInputElement {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return true;

  return element instanceof HTMLElement && element.isContentEditable;
}

function isUsableButton(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (!isVisibleElement(element)) return false;
  if (element.closest('[id^="prompt-rule-prepend-"]')) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  if (element instanceof HTMLButtonElement && element.disabled) return false;

  return true;
}

export function findInputBySelectors(inputSelector: string) {
  const input = queryVisible<HTMLElement>([
    inputSelector,
    '[contenteditable="true"]',
  ]);

  return isEditableInput(input) ? input : null;
}

export function findSubmitBySelectors(submitSelector: string, input: PromptInputElement | null) {
  const submitSelectors = [submitSelector, ...submitFallbackSelectors];
  const explicitSubmit = queryVisible<HTMLElement>(submitSelectors);
  if (explicitSubmit) return explicitSubmit;

  let container = input?.parentElement;

  for (let depth = 0; container && depth < 5; depth += 1) {
    const buttons = [...container.querySelectorAll('button, [role="button"]')]
      .filter(isUsableButton);

    if (buttons.length) return buttons.at(-1) ?? null;

    container = container.parentElement;
  }

  return null;
}

export function findInputFromTarget(target: EventTarget | null, inputSelector: string) {
  if (!(target instanceof Element)) return null;

  const direct = target.closest(inputSelector);
  if (isEditableInput(direct)) return direct;

  const editable = target.closest('[contenteditable="true"]');
  if (isEditableInput(editable)) return editable;

  return null;
}

function getConversationContainer(selector: string) {
  if (!selector.trim()) return null;
  return document.querySelector(selector);
}

function getConversationItems(container: Element, selector: string) {
  if (!selector.trim()) return [];

  return [...container.querySelectorAll(selector)].filter((item) => {
    if (!(item instanceof HTMLElement)) return false;
    if (item.id.startsWith('prompt-rule-prepend-')) return false;
    if (item.matches('script, style, template')) return false;
    if (item.getAttribute('aria-hidden') === 'true') return false;

    return true;
  });
}

export function hasConversationContent(containerSelector: string, itemSelector: string) {
  const container = getConversationContainer(containerSelector);
  if (!container) return false;

  const items = getConversationItems(container, itemSelector);
  if (itemSelector.trim()) return items.length > 0;
  if (items.length > 0) return true;

  const visibleChildren = [...container.children].filter((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child.id.startsWith('prompt-rule-prepend-')) return false;
    if (child.matches('script, style, template')) return false;
    if (child.getAttribute('aria-hidden') === 'true') return false;

    return Boolean(child.textContent?.trim() || child.children.length);
  });

  return visibleChildren.length > 0;
}
