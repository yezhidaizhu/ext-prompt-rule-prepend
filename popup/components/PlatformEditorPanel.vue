<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PopupPlatform, PopupRule } from '@/types/promptConfig';

const props = defineProps<{
  platform: PopupPlatform;
  rules: PopupRule[];
}>();

const emit = defineEmits<{
  back: [];
}>();

const defaultSelectorOpen = ref(false);

const currentDefaultRule = computed(() => props.rules.find((rule) => rule.id === props.platform.defaultRuleId));
const defaultSelectorLabel = computed(() => {
  if (!props.rules.length) return '暂无规则';

  return currentDefaultRule.value?.content || '选择默认规则';
});

function setDefaultRule(ruleId: string) {
  props.platform.defaultRuleId = ruleId;
  defaultSelectorOpen.value = false;
}

function toggleDefaultSelector() {
  if (!props.rules.length) return;

  defaultSelectorOpen.value = !defaultSelectorOpen.value;
}

function handlePanelClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('[data-platform-default-selector="true"]')) {
    defaultSelectorOpen.value = false;
  }
}
</script>

<template>
  <section class="absolute inset-0 z-10 flex flex-col popup-panel-layer backdrop-blur-xl" @click="handlePanelClick">
    <header class="popup-header border-b popup-divider">
      <button
        type="button"
        class="popup-icon-button popup-back-button popup-secondary-text popup-hover-primary"
        title="返回"
        aria-label="返回"
        @click="emit('back')"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <path d="m12 5-7 7 7 7" />
        </svg>
      </button>

      <h3 class="min-w-0 flex-1 px-2 text-sm font-semibold leading-none">编辑平台</h3>
    </header>

    <div class="flex-1 overflow-y-auto popup-settings-scroll">
      <div class="popup-section py-3">
        <div class="popup-editor-group-title">基础</div>
        <label class="popup-field-row">
          <span class="popup-field-label">名称</span>
          <input v-model="platform.name" class="popup-input" />
        </label>
        <label class="popup-field-row">
          <span class="popup-field-label">匹配 URL</span>
          <input v-model="platform.matchUrl" class="popup-input" />
        </label>
        <div class="popup-field-row popup-field-row-plain">
          <span class="popup-field-label">默认规则</span>
          <div class="relative min-w-0" data-platform-default-selector="true">
            <button
              type="button"
              class="popup-select-trigger"
              :class="defaultSelectorOpen ? 'popup-select-trigger-active' : ''"
              :disabled="!rules.length"
              @click="toggleDefaultSelector"
            >
              <span class="truncate">{{ defaultSelectorLabel }}</span>
              <svg class="size-3.5 shrink-0 transition" :class="defaultSelectorOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div v-if="defaultSelectorOpen" class="popup-select-menu">
              <button
                v-for="rule in rules"
                :key="rule.id"
                type="button"
                class="popup-select-option"
                :class="platform.defaultRuleId === rule.id ? 'popup-select-option-active' : ''"
                :title="rule.content || '未命名规则'"
                @click="setDefaultRule(rule.id)"
              >
                <span class="truncate">{{ rule.content || '未命名规则' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="popup-setting-row border-t border-b popup-divider">
        <div>
          <p class="text-[13px] font-medium popup-primary-text">启用平台</p>
          <p class="mt-0.5 text-xs popup-muted-label">关闭后不匹配该平台</p>
        </div>
        <button
          type="button"
          class="popup-switch"
          :class="platform.enabled ? 'popup-switch-on' : 'popup-switch-off'"
          :aria-pressed="platform.enabled"
          @click="platform.enabled = !platform.enabled"
        >
          <span class="popup-switch-thumb" />
        </button>
      </div>

      <div class="popup-section py-3">
        <div class="popup-editor-group-title">高级</div>
        <label class="popup-field-row">
          <span class="popup-field-label">Textarea</span>
          <input v-model="platform.textareaSelector" class="popup-input" />
        </label>
        <label class="popup-field-row">
          <span class="popup-field-label">Submit</span>
          <input v-model="platform.submitSelector" class="popup-input" />
        </label>
        <label class="popup-field-row">
          <span class="popup-field-label">对话列表</span>
          <input v-model="platform.conversationContainerSelector" class="popup-input" />
        </label>
        <label class="popup-field-row">
          <span class="popup-field-label">对话项</span>
          <input v-model="platform.conversationItemSelector" class="popup-input" />
        </label>
        <div class="popup-field-row popup-field-row-plain">
          <span class="popup-field-label">触发位置</span>
          <div class="grid min-w-0 grid-cols-2 gap-2">
            <label class="popup-offset-input">
              <span>X</span>
              <input v-model.number="platform.offsetX" type="number" class="popup-input" />
            </label>
            <label class="popup-offset-input">
              <span>Y</span>
              <input v-model.number="platform.offsetY" type="number" class="popup-input" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
