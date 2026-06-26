import type { App as VueApp } from 'vue';
import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { platformPresets } from '@/config/platforms';
import { getCurrentPlatformPreset } from '@/platforms';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import { ensureDialogPortal } from '@/utils/content/dialogPortal';
import ContentApp from './App.vue';

export default defineContentScript({
  matches: platformPresets.flatMap((platform) => platform.matches),
  cssInjectionMode: 'ui',
  async main(ctx) {
    console.debug('[prompt-rule-prepend] content script started', location.href);

    const preset = getCurrentPlatformPreset();
    if (!preset) {
      console.debug('[prompt-rule-prepend] no platform matched', location.href);
      return;
    }

    const mountFlag = '__promptRulePrependUiMounted__';
    if ((globalThis as Record<string, unknown>)[mountFlag]) {
      console.debug('[prompt-rule-prepend] content script already mounted, skip');
      return;
    }
    (globalThis as Record<string, unknown>)[mountFlag] = true;

    const pinia = createPinia();
    setActivePinia(pinia);
    await usePromptConfigStore().init();
    ensureDialogPortal();

    let app: VueApp<Element> | undefined;

    const ui = await createShadowRootUi(ctx, {
      name: `prompt-rule-prepend-${preset.id}`,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount(container, shadow) {
        const host = shadow.host as HTMLElement;
        Object.assign(host.style, {
          position: 'fixed',
          inset: '0 auto auto 0',
          width: '0',
          height: '0',
          zIndex: String(2147483646),
          pointerEvents: 'none',
        });
        container.style.pointerEvents = 'auto';

        app = createApp(ContentApp, { platformId: preset.id });
        app.use(pinia);
        app.mount(container);
        return app;
      },
      onRemove(mountedApp) {
        (mountedApp as VueApp<Element> | undefined)?.unmount();
      },
    });

    ui.mount();
    console.debug('[prompt-rule-prepend] mounted in shadow root', preset.id);

    ctx.onInvalidated(() => {
      ui.remove();
    });
  },
});
