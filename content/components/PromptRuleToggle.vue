<script setup lang="ts">
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { findPlatformRule, resolveActiveRule, createRuleForPlatform, updateRule } from '@/utils/promptConfig';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import StatusToggleIcon from './StatusToggleIcon.vue';
import EmptyListIcon from '@/shared/components/EmptyListIcon.vue';
import { layerZIndex } from '@/utils/content/layerZIndex';
import RuleCreateDialog from './RuleCreateDialog.vue';

const props = defineProps<{
  platformId: string;
}>();

const store = usePromptConfigStore();
const { config } = storeToRefs(store);
const { locale, t } = useI18n();

const open = ref(false);
const ruleFormOpen = ref(false);
const ruleFormMode = ref<'create' | 'edit'>('create');
const editingRuleId = ref('');
const enableAfterCreate = ref(false);
const iconRotation = ref(0);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const hoveredRuleId = ref('');

const platformRules = computed(() =>
  config.value.rules.filter(
    (rule) => rule.content.trim() && rule.platformIds.includes(props.platformId),
  ));

const hasAnyRules = computed(() => config.value.rules.some((rule) => rule.content.trim()));
const hasPlatformRules = computed(() => platformRules.value.length > 0);

const enabled = computed(() => config.value.enabled);
const injectableRule = computed(() => resolveActiveRule(config.value, props.platformId));
const availableRule = computed(() => findPlatformRule(config.value, props.platformId));
const canInject = computed(() => Boolean(injectableRule.value));
const iconActive = computed(() => enabled.value && canInject.value);
const activeRuleId = computed(() => availableRule.value?.id ?? '');
const previewRule = computed(() =>
  platformRules.value.find((rule) => rule.id === hoveredRuleId.value) ?? null);

const platformName = computed(() =>
  config.value.platforms.find((platform) => platform.id === props.platformId)?.name
  ?? props.platformId);

const createDialogHint = computed(() => {
  if (ruleFormMode.value === 'edit') {
    return t('content.createDialog.editAppliedHint', { platform: platformName.value });
  }

  if (enableAfterCreate.value) {
    return t('content.createDialog.enableAfterCreateHint');
  }

  return t('content.createDialog.createHint', { platform: platformName.value });
});

const editingRule = computed(() =>
  config.value.rules.find((rule) => rule.id === editingRuleId.value) ?? null);

const { floatingStyles, update } = useFloating(reference, floating, {
  placement: 'top-start',
  strategy: 'fixed',
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(14),
    flip({ fallbackPlacements: ['bottom-start', 'top-end', 'bottom-end'] }),
    shift({ padding: 12 }),
    size({
      padding: 12,
      apply({ availableWidth, elements }) {
        Object.assign(elements.floating.style, {
          maxWidth: `${Math.max(280, availableWidth)}px`,
        });
      },
    }),
  ],
});

async function togglePanel() {
  open.value = !open.value;
  hoveredRuleId.value = '';

  if (open.value) {
    await nextTick();
    update();
  }
}

function selectRule(ruleId: string) {
  config.value.selectedRuleId = ruleId;
  void store.persist();
}

async function openCreateDialog(options: { enableAfterCreate?: boolean } = {}) {
  ruleFormMode.value = 'create';
  editingRuleId.value = '';
  enableAfterCreate.value = options.enableAfterCreate ?? false;
  ruleFormOpen.value = true;
  open.value = false;
}

function openEditDialog(ruleId: string) {
  ruleFormMode.value = 'edit';
  editingRuleId.value = ruleId;
  enableAfterCreate.value = false;
  ruleFormOpen.value = true;
  open.value = false;
}

function closeRuleFormDialog() {
  ruleFormOpen.value = false;
  ruleFormMode.value = 'create';
  editingRuleId.value = '';
  enableAfterCreate.value = false;
}

function handleRuleCreate(payload: { content: string; enabled: boolean }) {
  const ruleId = createRuleForPlatform(
    config.value,
    props.platformId,
    payload.content,
    { enabled: payload.enabled },
  );

  if (!ruleId) return;

  if (enableAfterCreate.value && payload.enabled) {
    config.value.enabled = true;
  }

  void store.persist();
  closeRuleFormDialog();
}

function handleRuleSave(payload: { content: string; enabled: boolean }) {
  if (!editingRuleId.value) return;

  const saved = updateRule(config.value, editingRuleId.value, payload);
  if (!saved) return;

  void store.persist();
  closeRuleFormDialog();
}

function toggleEnabled() {
  if (enabled.value) {
    config.value.enabled = false;
    void store.persist();
    return;
  }

  if (!hasPlatformRules.value) {
    void openCreateDialog({ enableAfterCreate: true });
    return;
  }

  config.value.enabled = true;
  void store.persist();
}

watch(
  () => config.value.enabled,
  (value) => {
    iconRotation.value = value ? 0 : 180;
  },
  { immediate: true },
);

watch(
  () => config.value.settings.language,
  (language) => {
    locale.value = language;
  },
  { immediate: true },
);

function closePanel() {
  open.value = false;
  hoveredRuleId.value = '';
}

function isEventInsidePanel(event: Event) {
  const path = event.composedPath();
  if (reference.value && path.includes(reference.value)) return true;
  if (floating.value && path.includes(floating.value)) return true;
  return false;
}

function handlePointerDown(event: PointerEvent) {
  if (ruleFormOpen.value) return;
  if (!open.value) return;
  if (isEventInsidePanel(event)) return;
  closePanel();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (ruleFormOpen.value) {
      closeRuleFormDialog();
      return;
    }

    closePanel();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown, true);
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="prompt-rule-toggle">
    <button
      ref="reference"
      type="button"
      class="prompt-rule-trigger"
      :aria-expanded="open"
      :aria-label="t('content.ruleList')"
      @click="togglePanel"
    >
      <StatusToggleIcon :active="iconActive" :rotation="iconRotation" />
    </button>

    <Transition name="prompt-rule-popover">
      <div
        v-if="open"
        ref="floating"
        :style="{ ...floatingStyles, zIndex: layerZIndex.popover }"
        class="prompt-rule-floating"
      >
        <div class="prompt-rule-popover-frame">
          <div class="prompt-rule-popover-arrow" />

          <div class="prompt-rule-popover-panel">
            <div class="prompt-rule-popover-header">
              <p class="prompt-rule-popover-title">{{ t('content.ruleList') }}</p>
              <div class="prompt-rule-header-actions">
                <button
                  type="button"
                  class="prompt-rule-icon-button"
                  :title="t('content.addRule')"
                  :aria-label="t('content.addRule')"
                  @click.stop="openCreateDialog()"
                >
                  <svg
                    class="prompt-rule-header-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="prompt-rule-power"
                  :class="
                    enabled
                      ? 'prompt-rule-power-active'
                      : 'prompt-rule-power-inactive'
                  "
                  :aria-label="enabled ? t('content.enabled') : t('content.disabled')"
                  :title="enabled ? t('content.enabled') : t('content.disabled')"
                  @click.stop="toggleEnabled"
                >
                <svg
                  class="prompt-rule-power-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2v10" />
                  <path d="M18.4 6.6a8 8 0 1 1-12.8 0" />
                  <path v-if="!enabled" d="M4 4l16 16" />
                </svg>
                </button>
              </div>
            </div>

            <div
              class="prompt-rule-list"
              @mouseleave="hoveredRuleId = ''"
            >
              <div v-if="!hasPlatformRules" class="prompt-rule-empty">
                <EmptyListIcon class="prompt-rule-empty-icon" />
                <p class="prompt-rule-empty-title">
                  {{ hasAnyRules ? t('content.currentPlatformNoRules') : t('content.noRules') }}
                </p>
                <p class="prompt-rule-empty-hint">
                  {{
                    enabled
                      ? t('content.enabledNeedsRule')
                      : t('content.addRuleToEnable')
                  }}
                </p>
                <button
                  type="button"
                  class="prompt-rule-empty-action"
                  @click.stop="openCreateDialog()"
                >
                  {{ t('content.addRule') }}
                </button>
              </div>

              <template v-else>
                <p
                  v-if="enabled && !canInject"
                  class="prompt-rule-notice"
                >
                  {{ t('content.enabledNoInjectableRule') }}
                </p>

                <div
                  v-for="rule in platformRules"
                  :key="rule.id"
                  class="prompt-rule-item"
                  :class="activeRuleId === rule.id ? 'prompt-rule-item-active' : ''"
                  @mouseenter="hoveredRuleId = rule.id"
                  @focusin="hoveredRuleId = rule.id"
                >
                  <button
                    type="button"
                    class="prompt-rule-item-main"
                    @click="selectRule(rule.id)"
                  >
                    <p class="prompt-rule-item-text">
                      {{ rule.content }}
                    </p>
                  </button>
                  <button
                    type="button"
                    class="prompt-rule-item-edit"
                    :title="t('content.editRule')"
                    :aria-label="t('content.editRule')"
                    @click.stop="openEditDialog(rule.id)"
                  >
                    <svg
                      class="prompt-rule-item-edit-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
              </template>
            </div>
          </div>

          <Transition name="prompt-rule-preview">
            <aside
              v-if="previewRule"
              class="prompt-rule-preview-panel"
            >
              <p class="prompt-rule-preview-title">{{ t('content.ruleContent') }}</p>
              <p class="prompt-rule-preview-content">{{ previewRule.content }}</p>
            </aside>
          </Transition>
        </div>
      </div>
    </Transition>

    <RuleCreateDialog
      v-if="ruleFormOpen"
      :mode="ruleFormMode"
      :platform-name="platformName"
      :hint="createDialogHint"
      :initial-content="editingRule?.content ?? ''"
      :initial-enabled="editingRule?.enabled ?? true"
      @close="closeRuleFormDialog"
      @create="handleRuleCreate"
      @save="handleRuleSave"
    />
  </div>
</template>

<style scoped>
.prompt-rule-toggle {
  position: relative;
  display: inline-flex;
  isolation: isolate;
  color-scheme: dark;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.prompt-rule-trigger {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  outline: none;
}

.prompt-rule-floating {
  width: 344px;
  max-width: calc(100vw - 24px);
}

.prompt-rule-popover-frame {
  position: relative;
  transform: translateX(-12px);
}

.prompt-rule-popover-enter-active,
.prompt-rule-popover-leave-active {
  transition: opacity 120ms ease;
}

.prompt-rule-popover-enter-from,
.prompt-rule-popover-leave-to {
  opacity: 0;
}

.prompt-rule-popover-enter-to,
.prompt-rule-popover-leave-from {
  opacity: 1;
}

.prompt-rule-popover-arrow {
  position: absolute;
  bottom: -8px;
  left: 18px;
  z-index: 10;
  height: 0;
  width: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #1f1f1f;
}

.prompt-rule-popover-arrow::after {
  content: none;
}

.prompt-rule-popover-panel {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.06);
  border-radius: 16px;
  background: #1f1f1f;
  color: #ececec;
  text-align: left;
  box-shadow: 0 12px 36px rgb(0 0 0 / 0.28);
}

.prompt-rule-preview-panel {
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  width: 320px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgb(255 255 255 / 0.06);
  border-radius: 16px;
  background: #1f1f1f;
  box-shadow: 0 12px 36px rgb(0 0 0 / 0.28);
  padding: 12px 14px;
  text-align: left;
  scrollbar-width: thin;
  scrollbar-color: #4b4b4b transparent;
}

.prompt-rule-preview-title {
  margin: 0 0 8px;
  color: #b4b4b4;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.prompt-rule-preview-content {
  margin: 0;
  color: #ececec;
  font-size: 13px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.prompt-rule-popover-header {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 8px 2px 14px;
}

.prompt-rule-popover-title {
  margin: 0;
  color: #b4b4b4;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.prompt-rule-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-rule-icon-button,
.prompt-rule-power {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.prompt-rule-icon-button {
  color: #b4b4b4;
}

.prompt-rule-icon-button:hover {
  background: #303030;
  color: #ececec;
}

.prompt-rule-header-icon {
  display: block;
  width: 18px;
  height: 18px;
}

.prompt-rule-power:hover {
  background: #303030;
}

.prompt-rule-power-active {
  color: #19c37d;
}

.prompt-rule-power-inactive {
  color: #d1d5db;
}

.prompt-rule-power-icon {
  display: block;
  width: 18px;
  height: 18px;
}

.prompt-rule-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 2px 6px 8px;
  scrollbar-width: thin;
  scrollbar-color: #4b4b4b transparent;
}

.prompt-rule-notice {
  margin: 4px 2px 6px;
  border-radius: 8px;
  background: #2f2a1d;
  padding: 8px 10px;
  color: #f1c45d;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
}

.prompt-rule-empty {
  display: grid;
  min-height: 132px;
  place-content: center;
  justify-items: center;
  padding: 18px 16px 20px;
  text-align: center;
}

.prompt-rule-empty-icon {
  color: #8e8e8e;
}

.prompt-rule-empty-title {
  margin: 8px 0 0;
  color: #ececec;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.prompt-rule-empty-hint {
  margin: 4px 0 0;
  color: #8e8e8e;
  font-size: 12px;
  line-height: 1.4;
}

.prompt-rule-empty-action {
  margin-top: 12px;
  border: 0;
  border-radius: 8px;
  background: #303030;
  padding: 7px 12px;
  color: #ececec;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.prompt-rule-empty-action:hover {
  background: #3a3a3a;
}

.prompt-rule-item {
  display: flex;
  width: 100%;
  height: 36px;
  align-items: center;
  gap: 2px;
  border-radius: 8px;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.prompt-rule-item:first-child {
  border-top: 0;
}

.prompt-rule-item-active {
  background: rgb(25 195 125 / 0.16);
  color: #ececec;
}

.prompt-rule-item-main {
  display: flex;
  min-width: 0;
  flex: 1;
  height: 100%;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 0 0 0 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.prompt-rule-item:hover {
  background: #303030;
}

.prompt-rule-item-active:hover {
  background: rgb(25 195 125 / 0.2);
}

.prompt-rule-item-edit {
  display: grid;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  margin-right: 3px;
  padding: 0;
  color: #8e8e8e;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.prompt-rule-item-edit:hover {
  background: #444444;
  color: #ececec;
}

.prompt-rule-item-edit-icon {
  display: block;
  width: 14px;
  height: 14px;
}

.prompt-rule-item-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: #ececec;
}

.prompt-rule-item-active .prompt-rule-item-text {
  color: #f4f4f5;
}

.prompt-rule-list::-webkit-scrollbar {
  width: 4px;
}

.prompt-rule-list::-webkit-scrollbar-track {
  background: transparent;
}

.prompt-rule-list::-webkit-scrollbar-thumb {
  background: #4b4b4b;
  border-radius: 999px;
}

.prompt-rule-popover-enter-active .prompt-rule-popover-panel,
.prompt-rule-popover-leave-active .prompt-rule-popover-panel {
  transition: transform 140ms ease;
}

.prompt-rule-popover-enter-from .prompt-rule-popover-panel,
.prompt-rule-popover-leave-to .prompt-rule-popover-panel {
  transform: translateY(4px);
}

.prompt-rule-popover-enter-to .prompt-rule-popover-panel,
.prompt-rule-popover-leave-from .prompt-rule-popover-panel {
  transform: translateY(0);
}

.prompt-rule-preview-enter-active,
.prompt-rule-preview-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.prompt-rule-preview-enter-from,
.prompt-rule-preview-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.prompt-rule-preview-enter-to,
.prompt-rule-preview-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
