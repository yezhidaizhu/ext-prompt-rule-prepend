import { isVisibleElement, type PromptInputElement } from './domInput';

const submitFallbackSelectors = [
  'button[aria-label*="发送"]',
  'button[aria-label*="Send" i]',
  'button[data-testid*="send" i]',
  '[role="button"][aria-label*="发送"]',
  '[role="button"][aria-label*="Send" i]',
];

function splitSelectors(selector: string) {
  return selector.split(',').map((item) => item.trim()).filter(Boolean);
}

function isExcludedChatInput(element: Element) {
  return Boolean(element.closest('[id^="prompt-rule-prepend-"]'));
}

function isUsableChatInput(element: Element | null): element is PromptInputElement {
  if (!isEditableInput(element)) return false;
  if (!isVisibleElement(element)) return false;
  if (isExcludedChatInput(element)) return false;

  return true;
}

function pickComposerInput(elements: PromptInputElement[]) {
  return elements.reduce((best, current) => {
    const bestRect = best.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();

    if (currentRect.bottom > bestRect.bottom) return current;
    if (currentRect.bottom === bestRect.bottom && currentRect.width > bestRect.width) return current;

    return best;
  });
}

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
  for (const selector of splitSelectors(inputSelector)) {
    const elements = [...document.querySelectorAll<HTMLElement>(selector)]
      .filter(isUsableChatInput);

    if (elements.length) {
      return pickComposerInput(elements);
    }
  }

  return null;
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

  for (const selector of splitSelectors(inputSelector)) {
    if (isEditableInput(target)) {
      const matchedInputs = [...document.querySelectorAll<HTMLElement>(selector)]
        .filter(isUsableChatInput);
      if (matchedInputs.includes(target)) return target;
    }

    const direct = target.closest(selector);
    if (isUsableChatInput(direct)) return direct;
  }

  const editable = target.closest('[contenteditable="true"]');
  if (isUsableChatInput(editable)) return editable;

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

function isBroadConversationContainer(selector: string) {
  const normalized = selector.trim().toLowerCase();
  return normalized === 'main' || normalized === 'body' || normalized === '#root' || normalized === 'html';
}

export function hasConversationContent(containerSelector: string, itemSelector: string) {
  const container = getConversationContainer(containerSelector);
  if (!container) return false;

  const items = getConversationItems(container, itemSelector);
  if (itemSelector.trim()) return items.length > 0;

  if (isBroadConversationContainer(containerSelector)) return false;

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
