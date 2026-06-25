export default defineBackground(() => {
  async function injectIntoTab(tabId: number, url?: string | null) {
    if (!url || !url.includes('chat.deepseek.com/')) return;

    try {
      await browser.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: ['/content-scripts/content.js'],
      });
      console.debug('[prompt-rule-prepend] injected into tab', tabId, url);
    } catch (error) {
      console.error('[prompt-rule-prepend] inject failed', tabId, url, error);
    }
  }

  async function scanAndInject() {
    const tabs = await browser.tabs.query({});
    await Promise.all(tabs.flatMap((tab) => {
      if (typeof tab.id !== 'number') return [];
      return [injectIntoTab(tab.id, tab.url)];
    }));
  }

  browser.runtime.onInstalled.addListener(() => {
    void scanAndInject();
  });

  browser.runtime.onStartup.addListener(() => {
    void scanAndInject();
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      const resolvedTabId = tabId as number;
      void injectIntoTab(resolvedTabId, tab?.url ?? null);
    }
  });

  browser.webNavigation?.onCompleted?.addListener((details) => {
    if (details.frameId === 0) {
      void injectIntoTab(details.tabId, details.url);
    }
  }, { url: [{ hostSuffix: 'chat.deepseek.com' }] });
});
