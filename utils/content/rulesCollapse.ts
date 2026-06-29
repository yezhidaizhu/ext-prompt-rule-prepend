const foldedClass = 'prompt-rule-prepend-folded-rules';
const foldedMarker = 'data-prompt-rule-prepend-folded';
const foldedThemeAttribute = 'data-prompt-rule-theme';

const rulesPattern = /<RULES>\s*--------\s*([\s\S]*?)\s*--------\s*<\/RULES>/;

interface RulesCollapseSelectors {
  containerSelector: string;
  itemSelector: string;
}

type RulesCollapseTheme = 'auto' | 'black' | 'white';
type RulesCollapseSelectorSource = RulesCollapseSelectors | (() => RulesCollapseSelectors);

function resolveSelectors(source: RulesCollapseSelectorSource) {
  return typeof source === 'function' ? source() : source;
}

function ensureFoldStyles() {
  if (document.getElementById('prompt-rule-prepend-fold-styles')) return;

  const style = document.createElement('style');
  style.id = 'prompt-rule-prepend-fold-styles';
  style.textContent = `
    .${foldedClass} {
      --prp-fold-bg: #ffffff;
      --prp-fold-bg-hover: #f7f7f7;
      --prp-fold-border: rgb(0 0 0 / 0.08);
      --prp-fold-text: rgb(53 55 64);
      --prp-fold-icon: #19c37d;
      --prp-fold-body-text: rgb(31 41 55);
      --prp-fold-divider: rgb(0 0 0 / 0.08);
      display: block;
      max-width: 100%;
      width: fit-content;
      cursor: pointer;
      border: 1px solid var(--prp-fold-border);
      border-radius: 8px;
      background: var(--prp-fold-bg);
      margin: 6px 0 0;
      color: var(--prp-fold-body-text);
      font-size: 12px;
      line-height: 18px;
      list-style: none;
    }

    .${foldedClass}[${foldedThemeAttribute}="black"] {
      --prp-fold-bg: #1f1f1f;
      --prp-fold-bg-hover: #242424;
      --prp-fold-border: rgb(255 255 255 / 0.06);
      --prp-fold-text: #ececec;
      --prp-fold-icon: #19c37d;
      --prp-fold-body-text: #ececec;
      --prp-fold-divider: rgb(255 255 255 / 0.06);
    }

    @media (prefers-color-scheme: dark) {
      .${foldedClass}[${foldedThemeAttribute}="auto"] {
        --prp-fold-bg: #1f1f1f;
        --prp-fold-bg-hover: #242424;
        --prp-fold-border: rgb(255 255 255 / 0.06);
        --prp-fold-text: #ececec;
        --prp-fold-icon: #19c37d;
        --prp-fold-body-text: #ececec;
        --prp-fold-divider: rgb(255 255 255 / 0.06);
      }
    }

    .${foldedClass} > summary {
      display: flex;
      align-items: center;
      gap: 3px;
      min-height: 24px;
      padding: 3px 8px;
      list-style: none;
      user-select: none;
      color: var(--prp-fold-text);
      font-weight: 500;
    }

    .${foldedClass} > summary::-webkit-details-marker {
      display: none;
    }

    .${foldedClass}__icon {
      display: block;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      color: var(--prp-fold-icon);
      transition: transform 140ms ease;
    }

    .${foldedClass}[open] .${foldedClass}__icon {
      transform: rotate(90deg);
    }

    .${foldedClass}:hover,
    .${foldedClass}[open] {
      background: var(--prp-fold-bg-hover);
    }

    .${foldedClass}[open] > summary {
      color: var(--prp-fold-text);
    }

    .${foldedClass}__body {
      border-top: 1px solid var(--prp-fold-divider);
      padding: 7px 10px 8px 26px;
      white-space: pre-wrap;
      color: var(--prp-fold-body-text);
      font-size: 13px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
  `;
  document.documentElement.append(style);
}

function getTextNodes(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  return nodes;
}

function getConversationMessages(root: ParentNode, selectors: RulesCollapseSelectors) {
  const itemSelector = selectors.itemSelector.trim();
  const containerSelector = selectors.containerSelector.trim();
  if (!itemSelector || !containerSelector) return [];

  if (root instanceof Element && root.matches(itemSelector)) {
    return [root];
  }

  if (root instanceof Element) {
    const message = root.closest(itemSelector);
    if (message instanceof HTMLElement && message.closest(containerSelector)) return [message];
  }

  if (!('querySelectorAll' in root)) return [];

  return [...root.querySelectorAll(
    `${containerSelector} ${itemSelector}`,
  )].filter((item): item is HTMLElement => item instanceof HTMLElement);
}

function foldTextNode(node: Text, summaryLabel: string, theme: RulesCollapseTheme) {
  const text = node.nodeValue || '';
  const match = text.match(rulesPattern);
  if (!match) return false;

  const wrapper = document.createElement('details');
  wrapper.setAttribute(foldedMarker, 'true');
  wrapper.setAttribute(foldedThemeAttribute, theme);
  wrapper.className = foldedClass;

  const summary = document.createElement('summary');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', `${foldedClass}__icon`);
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2.4');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');

  const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  iconPath.setAttribute('d', 'm9 18 6-6-6-6');
  icon.append(iconPath);
  summary.append(icon, document.createTextNode(summaryLabel));

  const body = document.createElement('div');
  body.className = `${foldedClass}__body`;
  body.textContent = match[1].trim();

  wrapper.append(summary, body);

  const before = text.slice(0, match.index).replace(/\s+$/, '');
  const after = text.slice((match.index || 0) + match[0].length).replace(/^\s+/, '');
  const fragment = document.createDocumentFragment();

  if (before) fragment.append(document.createTextNode(before));
  fragment.append(wrapper);
  if (after) fragment.append(document.createTextNode(after));

  node.replaceWith(fragment);
  return true;
}

export function foldVisibleRules(
  selectorSource: RulesCollapseSelectorSource,
  root: ParentNode = document.body,
  summaryLabel = '规则',
  theme: RulesCollapseTheme = 'auto',
) {
  ensureFoldStyles();

  const selectors = resolveSelectors(selectorSource);
  const messageItems = getConversationMessages(root, selectors);
  for (const item of messageItems) {
    const textNodes = getTextNodes(item);
    for (const node of textNodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(`[${foldedMarker}]`)) continue;

      foldTextNode(node, summaryLabel, theme);
    }
  }
}

export function updateFoldedRuleSummaryLabels(summaryLabel: string) {
  document.querySelectorAll(`.${foldedClass} > summary`).forEach((summary) => {
    const textNode = [...summary.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = summaryLabel;
      return;
    }

    summary.append(document.createTextNode(summaryLabel));
  });
}

export function updateFoldedRuleTheme(theme: RulesCollapseTheme) {
  document.querySelectorAll(`.${foldedClass}`).forEach((wrapper) => {
    wrapper.setAttribute(foldedThemeAttribute, theme);
  });
}

export function observeRulesCollapse(
  selectorSource: RulesCollapseSelectorSource,
  getSummaryLabel: () => string = () => '规则',
  getTheme: () => RulesCollapseTheme = () => 'auto',
) {
  foldVisibleRules(selectorSource, document.body, getSummaryLabel(), getTheme());

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          foldVisibleRules(selectorSource, node, getSummaryLabel(), getTheme());
        } else if (node instanceof Text) {
          foldVisibleRules(selectorSource, node.parentElement || document.body, getSummaryLabel(), getTheme());
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}
