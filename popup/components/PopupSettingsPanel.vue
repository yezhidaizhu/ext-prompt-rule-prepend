<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import PlatformEditorPanel from './PlatformEditorPanel.vue';
import PlatformListPanel from './PlatformListPanel.vue';
import RuleEditorPanel from './RuleEditorPanel.vue';
import RuleListPanel from './RuleListPanel.vue';
import RulePreviewPanel from './RulePreviewPanel.vue';
import '@/popup/styles/shared.css';
import type { PopupPlatform, PopupRule, TriggerVisibility } from '@/types/promptConfig';

const props = withDefaults(
  defineProps<{
    preview?: boolean;
  }>(),
  {
    preview: false,
  },
);

const store = usePromptConfigStore();
const { config } = storeToRefs(store);
const { locale, t } = useI18n();

const activeTab = ref<'rules' | 'platforms'>('rules');
const ruleEditorId = ref('');
const rulePreviewId = ref('');
const platformEditorId = ref('');
const pendingDeleteRuleId = ref('');
const createRuleActive = ref(false);
const draftRuleContent = ref('');
const draftRuleEnabled = ref(true);
const draftRulePlatformIds = ref<string[]>([]);
const settingsOpen = ref(false);
const resetConfirmOpen = ref(false);

const editingRule = computed(() => config.value.rules.find((rule) => rule.id === ruleEditorId.value));
const previewingRule = computed(() => config.value.rules.find((rule) => rule.id === rulePreviewId.value));
const editingPlatform = computed(() => config.value.platforms.find((platform) => platform.id === platformEditorId.value));

const triggerVisibilityHint = computed(() => {
  switch (config.value.settings.triggerVisibility) {
    case 'always':
      return t('popup.settings.triggerHints.always');
    case 'newConversationOnly':
      return t('popup.settings.triggerHints.newConversationOnly');
    default:
      return t('popup.settings.triggerHints.hidden');
  }
});

function setTriggerVisibility(value: TriggerVisibility) {
  config.value.settings.triggerVisibility = value;
}

watch(
  config,
  () => {
    if (!store.ready || store.syncingRemote) return;
    void store.persist();
  },
  { deep: true },
);

onMounted(async () => {
  await store.init();
  locale.value = config.value.settings.language;
});

watch(
  () => config.value.settings.language,
  (language) => {
    locale.value = language;
  },
  { immediate: true },
);

function getRuleDefaultLabels(ruleId: string) {
  return config.value.platforms.filter((platform) => platform.defaultRuleId === ruleId).map((platform) => platform.name);
}

function createRule() {
  const content = draftRuleContent.value.trim();
  if (!content) return;

  const id = `rule-${Date.now()}`;
  config.value.rules.unshift({
    id,
    content,
    enabled: draftRuleEnabled.value,
    platformIds: [...draftRulePlatformIds.value],
  });
  activeTab.value = 'rules';
  draftRuleContent.value = '';
  draftRuleEnabled.value = true;
  draftRulePlatformIds.value = [];
  createRuleActive.value = false;
}

function openCreateRule() {
  rulePreviewId.value = '';
  draftRuleContent.value = '';
  draftRuleEnabled.value = true;
  draftRulePlatformIds.value = config.value.platforms.filter((platform) => platform.enabled).map((platform) => platform.id);
  createRuleActive.value = true;
}

function closeCreateRule() {
  createRuleActive.value = false;
  draftRuleContent.value = '';
  draftRuleEnabled.value = true;
  draftRulePlatformIds.value = [];
}

function toggleDraftRulePlatform(platformId: string) {
  if (draftRulePlatformIds.value.includes(platformId)) {
    draftRulePlatformIds.value = draftRulePlatformIds.value.filter((id) => id !== platformId);
    return;
  }

  draftRulePlatformIds.value = [...draftRulePlatformIds.value, platformId];
}

function deleteRule(ruleId: string) {
  const index = config.value.rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) return;

  config.value.rules.splice(index, 1);

  if (ruleEditorId.value === ruleId) ruleEditorId.value = '';
  if (rulePreviewId.value === ruleId) rulePreviewId.value = '';

  config.value.platforms.forEach((platform) => {
    if (platform.defaultRuleId === ruleId) platform.defaultRuleId = '';
  });
}

function openRuleEditor(ruleId: string) {
  rulePreviewId.value = '';
  ruleEditorId.value = ruleId;
}

function openRulePreview(ruleId: string) {
  if (rulePreviewId.value === ruleId) {
    rulePreviewId.value = '';
    return;
  }

  ruleEditorId.value = '';
  rulePreviewId.value = ruleId;
}

function openSettings() {
  rulePreviewId.value = '';
  settingsOpen.value = true;
}

function closeSettings() {
  settingsOpen.value = false;
}

function requestResetAll() {
  resetConfirmOpen.value = true;
}

async function confirmResetAll() {
  await store.resetToDefaults();
  ruleEditorId.value = '';
  rulePreviewId.value = '';
  platformEditorId.value = '';
  pendingDeleteRuleId.value = '';
  createRuleActive.value = false;
  resetConfirmOpen.value = false;
  closeSettings();
}

function openPlatformEditor(platformId: string) {
  rulePreviewId.value = '';
  platformEditorId.value = platformId;
}

function toggleRuleEnabled(ruleId: string) {
  const rule = config.value.rules.find((item) => item.id === ruleId);
  if (rule) rule.enabled = !rule.enabled;
}

function togglePlatformEnabled(platformId: string) {
  const platform = config.value.platforms.find((item) => item.id === platformId);
  if (platform) platform.enabled = !platform.enabled;
}

function requestDeleteRule(ruleId: string) {
  pendingDeleteRuleId.value = ruleId;
}

function confirmDeleteRule() {
  if (!pendingDeleteRuleId.value) return;

  deleteRule(pendingDeleteRuleId.value);
  pendingDeleteRuleId.value = '';
}

function toggleRulePlatform(rule: PopupRule, platformId: string) {
  if (rule.platformIds.includes(platformId)) {
    rule.platformIds = rule.platformIds.filter((id) => id !== platformId);
    return;
  }

  rule.platformIds = [...rule.platformIds, platformId];
}

function handlePanelClick(event: MouseEvent) {
  if (!rulePreviewId.value) return;

  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('.popup-preview-drawer')) return;
  if (target.closest('[data-popup-rule-view-trigger="true"]')) return;

  rulePreviewId.value = '';
}
</script>

<template>
  <aside
    class="popup-settings-panel popup-surface popup-shadow flex h-[520px] w-[360px] flex-col overflow-hidden rounded-none border backdrop-blur-xl"
    :class="[
      props.preview ? 'fixed left-4 top-4 z-40' : 'relative',
      config.settings.uiTheme === 'white' ? 'popup-theme-white' : config.settings.uiTheme === 'auto' ? 'popup-theme-auto' : 'popup-theme-black',
    ]"
    @click="handlePanelClick"
  >
    <header class="popup-header popup-divider border-b">
      <h2 class="text-sm font-semibold leading-none">{{ t('popup.title') }}</h2>

      <div class="flex items-center gap-1">
        <button
          v-if="activeTab === 'rules'"
          type="button"
          class="popup-icon-button popup-secondary-text"
          :title="t('popup.actions.newRule')"
          :aria-label="t('popup.actions.newRule')"
          @click="openCreateRule"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>

        <button
          type="button"
          class="popup-icon-button popup-secondary-text"
          :title="t('popup.actions.settings')"
          :aria-label="t('popup.actions.settings')"
          @click="openSettings"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21.3a2.1 2.1 0 0 1-4.2 0v-.05a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.9a2.1 2.1 0 0 1 0-4.2h.05A1.8 1.8 0 0 0 4.6 8.6a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04a1.8 1.8 0 0 0 1.98.36 1.8 1.8 0 0 0 1.1-1.66V2.3a2.1 2.1 0 0 1 4.2 0v.05a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04A1.8 1.8 0 0 0 19.4 8.6a1.8 1.8 0 0 0 1.66 1.1h.05a2.1 2.1 0 0 1 0 4.2h-.05A1.8 1.8 0 0 0 19.4 15Z" />
          </svg>
        </button>
      </div>
    </header>

    <div class="popup-main-tabs-wrap">
      <div class="popup-main-tabs">
        <button
          type="button"
          class="popup-main-tab"
          :class="activeTab === 'rules' ? 'popup-main-tab-active' : ''"
          @click="activeTab = 'rules'"
        >
          {{ t('popup.tabs.rules') }}
        </button>
        <button
          type="button"
          class="popup-main-tab"
          :class="activeTab === 'platforms' ? 'popup-main-tab-active' : ''"
          @click="activeTab = 'platforms'"
        >
          {{ t('popup.tabs.platforms') }}
        </button>
      </div>
    </div>

    <section v-if="settingsOpen" class="popup-panel-layer absolute inset-0 z-10 flex flex-col backdrop-blur-xl">
      <header class="popup-header border-b popup-divider">
        <button
          type="button"
          class="popup-icon-button popup-back-button popup-secondary-text popup-hover-primary"
          :title="t('common.back')"
          :aria-label="t('common.back')"
          @click="closeSettings"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5" />
            <path d="m12 5-7 7 7 7" />
          </svg>
        </button>

        <h3 class="min-w-0 flex-1 px-2 text-sm font-semibold leading-none">{{ t('popup.settings.title') }}</h3>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto popup-settings-scroll">
        <div class="popup-setting-block border-b popup-divider">
          <p class="text-[13px] font-medium popup-primary-text">{{ t('popup.settings.triggerButton') }}</p>
          <p class="popup-muted-label mt-1 text-xs leading-5">{{ triggerVisibilityHint }}</p>
          <div class="popup-trigger-segment mt-2.5">
            <button
              type="button"
              class="popup-trigger-segment-button"
              :class="config.settings.triggerVisibility === 'hidden' ? 'popup-trigger-segment-button-active' : ''"
              @click="setTriggerVisibility('hidden')"
            >
              {{ t('popup.settings.triggerOptions.hidden') }}
            </button>
            <button
              type="button"
              class="popup-trigger-segment-button"
              :class="config.settings.triggerVisibility === 'newConversationOnly' ? 'popup-trigger-segment-button-active' : ''"
              @click="setTriggerVisibility('newConversationOnly')"
            >
              {{ t('popup.settings.triggerOptions.newConversationOnly') }}
            </button>
            <button
              type="button"
              class="popup-trigger-segment-button"
              :class="config.settings.triggerVisibility === 'always' ? 'popup-trigger-segment-button-active' : ''"
              @click="setTriggerVisibility('always')"
            >
              {{ t('popup.settings.triggerOptions.always') }}
            </button>
          </div>
        </div>

        <div class="popup-setting-row border-b popup-divider">
          <p class="text-[13px] font-medium popup-primary-text">{{ t('popup.settings.theme') }}</p>
          <div class="popup-theme-segment">
            <button
              type="button"
              class="popup-theme-icon-button"
              :class="config.settings.uiTheme === 'auto' ? 'popup-theme-icon-button-active' : ''"
              :title="t('popup.settings.themeOptions.auto')"
              :aria-label="t('popup.settings.themeOptions.auto')"
              @click="config.settings.uiTheme = 'auto'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="5" width="16" height="11" rx="2" />
                <path d="M8 19h8" />
                <path d="M12 16v3" />
              </svg>
            </button>
            <button
              type="button"
              class="popup-theme-icon-button"
              :class="config.settings.uiTheme === 'black' ? 'popup-theme-icon-button-active' : ''"
              :title="t('popup.settings.themeOptions.black')"
              :aria-label="t('popup.settings.themeOptions.black')"
              @click="config.settings.uiTheme = 'black'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3a7 7 0 1 0 9 9 9 9 0 0 1-9-9Z" />
              </svg>
            </button>
            <button
              type="button"
              class="popup-theme-icon-button"
              :class="config.settings.uiTheme === 'white' ? 'popup-theme-icon-button-active' : ''"
              :title="t('popup.settings.themeOptions.white')"
              :aria-label="t('popup.settings.themeOptions.white')"
              @click="config.settings.uiTheme = 'white'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2.5" />
                <path d="M12 19.5V22" />
                <path d="M4.5 4.5 6.3 6.3" />
                <path d="M17.7 17.7 19.5 19.5" />
                <path d="M2 12h2.5" />
                <path d="M19.5 12H22" />
                <path d="M4.5 19.5 6.3 17.7" />
                <path d="M17.7 6.3 19.5 4.5" />
              </svg>
            </button>
          </div>
        </div>

        <div class="popup-setting-row border-b popup-divider">
          <p class="text-[13px] font-medium popup-primary-text">{{ t('popup.settings.language') }}</p>
          <select
            v-model="config.settings.language"
            class="popup-language-select"
            :aria-label="t('popup.settings.language')"
          >
            <option value="en">{{ t('popup.settings.languages.en') }}</option>
            <option value="zh">{{ t('popup.settings.languages.zh') }}</option>
            <option value="ja">{{ t('popup.settings.languages.ja') }}</option>
            <option value="ko">{{ t('popup.settings.languages.ko') }}</option>
          </select>
        </div>

        <div class="popup-setting-block">
          <p class="text-[13px] font-medium popup-primary-text">{{ t('popup.settings.resetData') }}</p>
          <p class="popup-muted-label mt-1 text-xs leading-5">
            {{ t('popup.settings.resetDescription') }}
          </p>
          <button
            type="button"
            class="popup-reset-button mt-3"
            @click="requestResetAll"
          >
            {{ t('popup.settings.resetAll') }}
          </button>
        </div>
      </div>
    </section>

    <section v-else class="min-h-0 flex-1 overflow-y-auto popup-settings-scroll">
      <template v-if="activeTab === 'rules'">
        <RuleListPanel
          :rules="config.rules"
          @create="openCreateRule"
          @delete="requestDeleteRule"
          @edit="openRuleEditor"
          @toggle-enabled="toggleRuleEnabled"
          @view="openRulePreview"
        />
      </template>

      <template v-else>
        <PlatformListPanel
          :platforms="config.platforms"
          @edit="openPlatformEditor"
          @toggle-enabled="togglePlatformEnabled"
        />
      </template>
    </section>

    <RulePreviewPanel
      v-if="previewingRule"
      :default-labels="getRuleDefaultLabels(previewingRule.id)"
      :platforms="config.platforms"
      :rule="previewingRule"
      @close="rulePreviewId = ''"
    />

    <RuleEditorPanel
      v-if="editingRule"
      v-model:content="editingRule.content"
      v-model:enabled="editingRule.enabled"
      mode="edit"
      :platform-ids="editingRule.platformIds"
      :platforms="config.platforms"
      @back="ruleEditorId = ''"
      @delete="requestDeleteRule(editingRule.id)"
      @toggle-platform="toggleRulePlatform(editingRule, $event)"
    />

    <RuleEditorPanel
      v-if="createRuleActive"
      v-model:content="draftRuleContent"
      v-model:enabled="draftRuleEnabled"
      mode="create"
      :platform-ids="draftRulePlatformIds"
      :platforms="config.platforms"
      @back="closeCreateRule"
      @create="createRule"
      @toggle-platform="toggleDraftRulePlatform"
    />

    <PlatformEditorPanel
      v-if="editingPlatform"
      :platform="editingPlatform"
      :rules="config.rules"
      @back="platformEditorId = ''"
    />

    <div
      v-if="resetConfirmOpen"
      class="popup-overlay absolute inset-0 z-20 grid place-items-center px-5 backdrop-blur-sm"
      @click.self="resetConfirmOpen = false"
    >
      <section class="popup-surface popup-shadow-sm min-w-0 w-full max-w-[calc(100vw-2.5rem)] rounded-xl border">
        <div class="popup-section popup-divider min-w-0 border-b py-3">
          <h3 class="popup-primary-text text-sm font-semibold">{{ t('popup.resetDialog.title') }}</h3>
          <p class="popup-muted-label mt-1 text-xs leading-5">
            {{ t('popup.resetDialog.description') }}
          </p>
        </div>

        <div class="popup-section flex items-center justify-end gap-2 py-2.5">
          <button
            type="button"
            class="popup-secondary-text rounded-md px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--popup-hover)]"
            @click="resetConfirmOpen = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="popup-action-danger rounded-md px-3 py-1.5 text-xs font-medium transition"
            @click="confirmResetAll"
          >
            {{ t('popup.resetDialog.confirm') }}
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="pendingDeleteRuleId"
      class="popup-overlay absolute inset-0 z-20 grid place-items-center px-5 backdrop-blur-sm"
      @click.self="pendingDeleteRuleId = ''"
    >
      <section class="popup-surface popup-shadow-sm min-w-0 w-full max-w-[calc(100vw-2.5rem)] rounded-xl border">
        <div class="popup-section popup-divider min-w-0 border-b py-3">
          <h3 class="popup-primary-text text-sm font-semibold">{{ t('popup.deleteDialog.title') }}</h3>
          <p
            class="popup-muted-label mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs"
            :title="config.rules.find((rule) => rule.id === pendingDeleteRuleId)?.content || t('common.unnamedRule')"
          >
            {{ config.rules.find((rule) => rule.id === pendingDeleteRuleId)?.content || t('common.unnamedRule') }}
          </p>
        </div>

        <div class="popup-section flex items-center justify-end gap-2 py-2.5">
          <button
            type="button"
            class="popup-secondary-text rounded-md px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--popup-hover)]"
            @click="pendingDeleteRuleId = ''"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="popup-action-danger rounded-md px-3 py-1.5 text-xs font-medium transition"
            @click="confirmDeleteRule"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.popup-theme-segment {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 120px;
  overflow: hidden;
  border: 1px solid var(--popup-segment-border);
  border-radius: 7px;
  background: var(--popup-segment-bg);
}

.popup-theme-icon-button {
  display: grid;
  height: 28px;
  place-items: center;
  color: var(--popup-text-muted);
  border-right: 1px solid var(--popup-segment-border);
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.popup-theme-icon-button:last-child {
  border-right: 0;
}

.popup-theme-icon-button svg {
  width: 14px;
  height: 14px;
}

.popup-theme-icon-button-active {
  background: var(--popup-accent-soft);
  color: var(--popup-accent);
}

.popup-language-select {
  min-width: 116px;
  height: 28px;
  border: 1px solid var(--popup-segment-border);
  border-radius: 7px;
  background: var(--popup-segment-bg);
  padding: 0 26px 0 9px;
  color: var(--popup-primary-text);
  font-size: 12px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
}

.popup-main-tabs-wrap {
  border-bottom: 1px solid var(--popup-border-muted);
  padding: 6px var(--popup-panel-x);
}

.popup-main-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  min-height: 30px;
  overflow: hidden;
  border: 1px solid var(--popup-tab-shell-border);
  border-radius: 7px;
  background: var(--popup-tab-strip-bg);
  padding: 2px;
}

.popup-main-tab {
  min-width: 0;
  height: 26px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  padding: 0 10px;
  color: var(--popup-text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.popup-main-tab:hover {
  background: var(--popup-tab-shell-bg);
  color: var(--popup-text);
}

.popup-main-tab-active {
  background: var(--popup-tab-active-bg);
  color: var(--popup-tab-active-text);
  font-weight: 600;
}

.popup-setting-block {
  padding: 12px var(--popup-panel-x) 14px;
}

.popup-trigger-segment {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border-radius: 8px;
  background: var(--popup-tab-shell-bg);
  padding: 2px;
  gap: 2px;
}

.popup-trigger-segment-button {
  min-width: 0;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--popup-text-muted);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.popup-trigger-segment-button-active {
  background: var(--popup-tab-active-bg);
  color: var(--popup-tab-active-text);
}

.popup-reset-button {
  width: 100%;
  border: 1px solid rgb(248 113 113 / 0.35);
  border-radius: 8px;
  background: rgb(248 113 113 / 0.08);
  padding: 8px 12px;
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.popup-reset-button:hover {
  background: rgb(248 113 113 / 0.14);
  border-color: rgb(248 113 113 / 0.5);
}
</style>
