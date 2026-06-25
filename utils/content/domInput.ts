export type PromptInputElement = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

export function isVisibleElement(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
}

export function readInputValue(input: PromptInputElement) {
  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    return input.value;
  }

  return input.innerText || input.textContent || '';
}

export function writeInputValue(input: PromptInputElement, value: string) {
  input.focus();

  if (input instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(input, value);
  } else if (input instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
  } else {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(input);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const inserted = document.execCommand('insertText', false, value);
    if (!inserted) {
      input.textContent = value;
    }
  }

  input.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data: value,
    inputType: 'insertText',
  }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function buildAppendedPrompt(rule: string, message: string) {
  const trimmedRule = rule.trim();
  const originalMessage = message.trim();

  if (!trimmedRule || !originalMessage) return message;

  const suffix = `\n<RULES> --------\n${trimmedRule}\n-------- </RULES>`;
  if (message.includes('<RULES>')) return message;

  return `${message}${suffix}`;
}

export function containsOrEquals(parent: Element, target: EventTarget | null) {
  return target instanceof Node && (parent === target || parent.contains(target));
}
