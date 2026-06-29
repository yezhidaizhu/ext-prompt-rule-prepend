<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PopupRule } from '@/types/promptConfig';
import EmptyListIcon from '@/shared/components/EmptyListIcon.vue';
import { usePromptClipboard } from '@/popup/composables/usePromptClipboard';

defineProps<{
  rules: PopupRule[];
}>();

const emit = defineEmits<{
  create: [];
  view: [ruleId: string];
  edit: [ruleId: string];
  delete: [ruleId: string];
  toggleEnabled: [ruleId: string];
}>();

const copiedRuleId = ref('');
const { copyText } = usePromptClipboard();
const { t } = useI18n();

function markCopied(ruleId: string) {
  copiedRuleId.value = ruleId;
  window.setTimeout(() => {
    if (copiedRuleId.value === ruleId) {
      copiedRuleId.value = '';
    }
  }, 1200);
}

async function copyRule(rule: PopupRule) {
  const content = rule.content || '';
  if (!content) return;

  if (await copyText(content)) {
    markCopied(rule.id);
  }
}
</script>

<template>
  <div v-if="!rules.length" class="popup-empty-state">
    <EmptyListIcon class="popup-muted-label" />
    <p class="mt-2 text-[13px] font-medium popup-secondary-text">{{ t('popup.rules.empty') }}</p>
    <button
      type="button"
      class="popup-action-primary mt-3 rounded-lg px-3 py-1.5 text-xs font-medium transition"
      @click="emit('create')"
    >
      {{ t('popup.actions.newRule') }}
    </button>
  </div>

  <div
    v-for="rule in rules"
    :key="rule.id"
    class="border-b popup-divider"
  >
    <div class="popup-list-row">
      <button
        type="button"
        data-popup-rule-view-trigger="true"
        class="popup-hover-primary min-w-0 flex-1 truncate text-left text-[13px] popup-primary-text transition"
        :title="t('popup.rules.viewFull')"
        @click="emit('view', rule.id)"
      >
        {{ rule.content || t('common.unnamedRule') }}
      </button>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="popup-icon-button"
          :class="rule.enabled ? 'popup-accent-text' : 'popup-danger-text'"
          :title="rule.enabled ? t('popup.rules.disable') : t('popup.rules.enable')"
          :aria-label="rule.enabled ? t('popup.rules.disable') : t('popup.rules.enable')"
          @click="emit('toggleEnabled', rule.id)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v8" />
            <path d="M7.05 6.35a8 8 0 1 0 9.9 0" />
            <path v-if="!rule.enabled" d="M4 4l16 16" />
          </svg>
        </button>

        <button
          type="button"
          class="popup-icon-button popup-muted-label popup-hover-primary"
          :class="copiedRuleId === rule.id ? 'popup-accent-text' : ''"
          :title="copiedRuleId === rule.id ? t('common.copied') : t('popup.rules.copy')"
          :aria-label="copiedRuleId === rule.id ? t('common.copied') : t('popup.rules.copy')"
          @click.stop="copyRule(rule)"
        >
          <svg v-if="copiedRuleId !== rule.id" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg v-else class="popup-accent-text size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 4 4 10-10" />
          </svg>
        </button>

        <button
          type="button"
          class="popup-icon-button popup-muted-label popup-hover-danger"
          :title="t('popup.rules.delete')"
          :aria-label="t('popup.rules.delete')"
          @click="emit('delete', rule.id)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M6.5 6.5 7.4 20h9.2l.9-13.5" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
          </svg>
        </button>

        <button
          type="button"
          class="popup-icon-button popup-muted-label popup-hover-primary"
          :title="t('popup.rules.edit')"
          :aria-label="t('popup.rules.edit')"
          @click="emit('edit', rule.id)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
