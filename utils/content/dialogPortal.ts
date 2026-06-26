import dialogStyles from '@/content/styles/rule-create-dialog.css?raw';

export const DIALOG_PORTAL_ID = 'prompt-rule-prepend-dialog-root';
const DIALOG_STYLE_ID = 'prompt-rule-prepend-dialog-styles';

let createDialogOpenCount = 0;

export function setCreateDialogOpen(open: boolean): void {
  createDialogOpenCount = Math.max(0, createDialogOpenCount + (open ? 1 : -1));

  if (!open && createDialogOpenCount === 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('prompt-rule-prepend:create-dialog-closed'));
  }
}

export function isCreateDialogOpen(): boolean {
  return createDialogOpenCount > 0;
}

export function injectDialogStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(DIALOG_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = DIALOG_STYLE_ID;
  style.textContent = dialogStyles;
  document.head.appendChild(style);
}

export function ensureDialogPortal(): HTMLElement {
  injectDialogStyles();

  let portal = document.getElementById(DIALOG_PORTAL_ID);

  if (!portal) {
    portal = document.createElement('div');
    portal.id = DIALOG_PORTAL_ID;
    document.body.appendChild(portal);
  }

  return portal;
}

export function resolveDialogPortalTarget(): HTMLElement | string {
  if (typeof document === 'undefined') {
    return 'body';
  }

  return ensureDialogPortal();
}
