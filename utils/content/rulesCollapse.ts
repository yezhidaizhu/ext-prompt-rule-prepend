const foldedClass = 'prompt-rule-prepend-folded-rules';
const foldedMarker = 'data-prompt-rule-prepend-folded';

const rulesPattern = /<RULES>\s*--------\s*([\s\S]*?)\s*--------\s*<\/RULES>/;

interface RulesCollapseSelectors {
  containerSelector: string;
  itemSelector: string;
}

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
      display: block;
      max-width: 100%;
      width: fit-content;
      cursor: pointer;
      border: 1px solid rgb(52 245 163 / 0.34);
      border-radius: 7px;
      background: rgb(52 245 163 / 0.12);
      margin: 8px 0 0;
      color: #34f5a3;
      font-size: 12px;
      line-height: 18px;
      list-style: none;
    }

    .${foldedClass} > summary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 7px;
      list-style: none;
      user-select: none;
    }

    .${foldedClass} > summary::-webkit-details-marker {
      display: none;
    }

    .${foldedClass} > summary::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: currentColor;
      opacity: 0.85;
    }

    .${foldedClass}__body {
      border-top: 1px solid rgb(52 245 163 / 0.18);
      padding: 7px 8px 8px;
      white-space: pre-wrap;
      color: rgb(212 255 233);
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

function foldTextNode(node: Text, summaryLabel: string) {
  const text = node.nodeValue || '';
  const match = text.match(rulesPattern);
  if (!match) return false;

  const wrapper = document.createElement('details');
  wrapper.setAttribute(foldedMarker, 'true');
  wrapper.className = foldedClass;

  const summary = document.createElement('summary');
  summary.textContent = summaryLabel;

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
) {
  ensureFoldStyles();

  const selectors = resolveSelectors(selectorSource);
  const messageItems = getConversationMessages(root, selectors);
  for (const item of messageItems) {
    const textNodes = getTextNodes(item);
    for (const node of textNodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(`[${foldedMarker}]`)) continue;

      foldTextNode(node, summaryLabel);
    }
  }
}

export function updateFoldedRuleSummaryLabels(summaryLabel: string) {
  document.querySelectorAll(`.${foldedClass} > summary`).forEach((summary) => {
    summary.textContent = summaryLabel;
  });
}

export function observeRulesCollapse(
  selectorSource: RulesCollapseSelectorSource,
  getSummaryLabel: () => string = () => '规则',
) {
  foldVisibleRules(selectorSource, document.body, getSummaryLabel());

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          foldVisibleRules(selectorSource, node, getSummaryLabel());
        } else if (node instanceof Text) {
          foldVisibleRules(selectorSource, node.parentElement || document.body, getSummaryLabel());
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
