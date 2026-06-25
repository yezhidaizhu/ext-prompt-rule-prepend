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
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import StatusToggleIcon from './StatusToggleIcon.vue';
import EmptyListIcon from '@/shared/components/EmptyListIcon.vue';

const props = withDefaults(
  defineProps<{
    rules?: string[];
  }>(),
  {
    rules: () => [],
  },
);

const store = usePromptConfigStore();
const { config } = storeToRefs(store);

const open = ref(false);
const iconRotation = ref(0);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

const promptRules = computed(() =>
  config.value.rules.map((rule) => rule.content).filter(Boolean));

const hasRules = computed(() => promptRules.value.length > 0);

const enabled = computed(() => config.value.enabled);

const selectedRule = computed(() => {
  const selected = config.value.rules.find((rule) => rule.id === config.value.selectedRuleId);
  return selected?.content || promptRules.value[0] || '';
});

const { floatingStyles, update } = useFloating(reference, floating, {
  placement: 'top-start',
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

  if (open.value) {
    await nextTick();
    update();
  }
}

function selectRule(rule: string) {
  const matched = config.value.rules.find((item) => item.content === rule);
  if (!matched) return;

  config.value.selectedRuleId = matched.id;
  void store.persist();
}

function toggleEnabled() {
  config.value.enabled = !config.value.enabled;
  void store.persist();
}

watch(
  () => config.value.enabled,
  (value, previous) => {
    if (previous === undefined) {
      iconRotation.value = value ? 0 : 180;
      return;
    }

    iconRotation.value += 180;
  },
  { immediate: true },
);

function closePanel() {
  open.value = false;
}

function isEventInsidePanel(event: Event) {
  const path = event.composedPath();
  if (reference.value && path.includes(reference.value)) return true;
  if (floating.value && path.includes(floating.value)) return true;
  return false;
}

function handlePointerDown(event: PointerEvent) {
  if (!open.value) return;
  if (isEventInsidePanel(event)) return;
  closePanel();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
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
      aria-label="规则列表"
      @click="togglePanel"
    >
      <StatusToggleIcon :active="enabled" :rotation="iconRotation" />
    </button>

    <Transition name="prompt-rule-popover">
      <div
        v-if="open"
        ref="floating"
        :style="floatingStyles"
        class="prompt-rule-floating"
      >
        <div class="prompt-rule-popover-frame">
          <div class="prompt-rule-popover-arrow" />

          <div class="prompt-rule-popover-panel">
            <div class="prompt-rule-popover-header">
              <p class="prompt-rule-popover-title">规则列表</p>
              <button
                type="button"
                class="prompt-rule-power"
                :class="
                  enabled
                    ? 'prompt-rule-power-active'
                    : 'prompt-rule-power-inactive'
                "
                :aria-label="enabled ? '已启用' : '已禁用'"
                :title="enabled ? '已启用' : '已禁用'"
                @click="toggleEnabled"
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

            <div class="prompt-rule-list">
              <div v-if="!hasRules" class="prompt-rule-empty">
                <EmptyListIcon class="prompt-rule-empty-icon" />
                <p class="prompt-rule-empty-title">暂无规则</p>
                <p class="prompt-rule-empty-hint">打开扩展 popup 添加规则</p>
              </div>

              <button
                v-for="rule in promptRules"
                :key="rule"
                type="button"
                class="prompt-rule-item"
                :class="selectedRule === rule ? 'prompt-rule-item-active' : ''"
                @click="selectRule(rule)"
              >
                <p class="prompt-rule-item-text">
                  {{ rule }}
                </p>
                <span
                  v-if="selectedRule === rule"
                  class="prompt-rule-check"
                >
                  ✓
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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
  z-index: 2147483647;
  width: 320px;
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
  bottom: -9px;
  left: 17px;
  z-index: 10;
  height: 0;
  width: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid rgb(255 255 255 / 0.1);
}

.prompt-rule-popover-arrow::after {
  content: '';
  position: absolute;
  left: -8px;
  top: -10px;
  height: 0;
  width: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgb(32 33 36 / 0.92);
}

.prompt-rule-popover-panel {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 12px;
  background: rgb(32 33 36 / 0.78);
  color: #f4f4f5;
  text-align: left;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.3);
  backdrop-filter: blur(18px);
}

.prompt-rule-popover-header {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  padding-inline: 12px;
}

.prompt-rule-popover-title {
  margin: 0;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.prompt-rule-power {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.prompt-rule-power:hover {
  background: rgb(255 255 255 / 0.06);
}

.prompt-rule-power-active {
  color: #6ee7b7;
}

.prompt-rule-power-inactive {
  color: #fca5a5;
}

.prompt-rule-power-icon {
  display: block;
  width: 18px;
  height: 18px;
}

.prompt-rule-list {
  overflow: hidden;
  scrollbar-width: thin;
  scrollbar-color: #52525b transparent;
}

.prompt-rule-empty {
  display: grid;
  min-height: 120px;
  place-content: center;
  justify-items: center;
  padding: 20px 16px;
  text-align: center;
}

.prompt-rule-empty-icon {
  color: #71717a;
}

.prompt-rule-empty-title {
  margin: 8px 0 0;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.prompt-rule-empty-hint {
  margin: 4px 0 0;
  color: #71717a;
  font-size: 12px;
  line-height: 1.4;
}

.prompt-rule-item {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-top: 1px solid rgb(255 255 255 / 0.08);
  background: transparent;
  padding: 0 12px;
  color: #d4d4d8;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.prompt-rule-item:first-child {
  border-top: 0;
}

.prompt-rule-item:hover {
  background: rgb(255 255 255 / 0.06);
}

.prompt-rule-item-active {
  background: rgb(52 245 163 / 0.1);
  color: #f4f4f5;
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
}

.prompt-rule-check {
  flex-shrink: 0;
  color: #6ee7b7;
  font-size: 14px;
  line-height: 20px;
}

.prompt-rule-list::-webkit-scrollbar {
  width: 4px;
}

.prompt-rule-list::-webkit-scrollbar-track {
  background: transparent;
}

.prompt-rule-list::-webkit-scrollbar-thumb {
  background: #52525b;
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
</style>
