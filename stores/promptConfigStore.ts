import { defineStore } from 'pinia';
import {
  cloneConfig,
  createDefaultPromptConfig,
  loadPromptConfig,
  observePromptConfigChanges,
  savePromptConfig,
  type PromptConfig,
} from '@/utils/promptConfig';

let stopObserving: (() => void) | null = null;

export const usePromptConfigStore = defineStore('promptConfig', {
  state: () => ({
    config: createDefaultPromptConfig(),
    ready: false,
    syncingRemote: false,
  }),

  getters: {
    enabled: (state) => state.config.enabled,
    selectedRuleId: (state) => state.config.selectedRuleId,
    rules: (state) => state.config.rules,
    platforms: (state) => state.config.platforms,
    settings: (state) => state.config.settings,
  },

  actions: {
    async init() {
      if (this.ready) return;

      this.config = await loadPromptConfig();
      this.ready = true;

      if (!stopObserving) {
        stopObserving = observePromptConfigChanges((config) => {
          this.applyRemote(config);
        });
      }
    },

    applyRemote(config: PromptConfig) {
      const next = cloneConfig(config);
      if (JSON.stringify(this.config) === JSON.stringify(next)) return;

      this.syncingRemote = true;
      this.config = next;
      this.syncingRemote = false;
    },

    async persist() {
      if (!this.ready || this.syncingRemote) return;

      await savePromptConfig(this.config);
    },

    replaceConfig(config: PromptConfig) {
      this.config = cloneConfig(config);
    },
  },
});

export function disposePromptConfigStore() {
  stopObserving?.();
  stopObserving = null;
}
