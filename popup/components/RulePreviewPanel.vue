<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PopupPlatform, PopupRule } from '@/types/promptConfig';
import { usePromptClipboard } from '@/popup/composables/usePromptClipboard';

const props = defineProps<{
  rule: PopupRule;
  platforms: PopupPlatform[];
  defaultLabels: string[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const copied = ref(false);
const { copyText } = usePromptClipboard();
const { t } = useI18n();

const matchedPlatforms = computed(() => props.platforms
    .filter((platform) => props.rule.platformIds.includes(platform.id))
);

async function copyRule() {
  const content = props.rule.content || '';
  if (!content) return;

  if (!(await copyText(content))) {
    return;
  }

  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1200);
}
</script>

<template>
  <aside
    class="popup-preview-drawer popup-shadow-sm absolute -right-px -top-px -bottom-px z-20 flex w-[72%] flex-col overflow-hidden border-l"
    @click.stop
  >
      <header class="popup-header popup-header-sm popup-divider border-b">
        <h3 class="text-sm font-semibold leading-none">{{ t('popup.rules.content') }}</h3>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="popup-icon-button popup-hover-primary"
            :class="copied ? 'popup-accent-text' : 'popup-secondary-text'"
            :title="copied ? t('common.copied') : t('common.copy')"
            :aria-label="copied ? t('common.copied') : t('common.copy')"
            @click="copyRule"
          >
            <svg v-if="!copied" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else class="popup-accent-text size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 4 4 10-10" />
            </svg>
          </button>

          <button
            type="button"
            class="popup-icon-button popup-secondary-text popup-hover-primary"
            :title="t('common.close')"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div class="popup-section min-h-0 flex-1 overflow-y-auto py-3 popup-settings-scroll">
        <p class="whitespace-pre-wrap text-[13px] leading-6 popup-primary-text">
          {{ rule.content || t('common.unnamedRule') }}
        </p>
      </div>

      <div class="popup-section popup-divider shrink-0 border-t py-2.5">
          <div class="flex items-center justify-between gap-3">
            <span class="popup-muted-label shrink-0 text-[11px]">{{ t('popup.rules.status') }}</span>
            <span class="truncate text-right text-xs" :class="rule.enabled ? 'popup-accent-text' : 'popup-danger-text'">
              {{ rule.enabled ? t('popup.rules.enabled') : t('popup.rules.disabled') }}
            </span>
          </div>

          <div class="mt-3">
            <p class="popup-muted-label mb-2 text-[11px]">{{ t('popup.rules.applicablePlatforms') }}</p>
            <div class="flex min-w-0 flex-wrap gap-1">
              <span
                v-for="platform in matchedPlatforms"
                :key="platform.id"
                class="popup-preview-tag"
              >
                {{ platform.name }}
              </span>
              <span v-if="!matchedPlatforms.length" class="popup-muted-label text-xs">{{ t('popup.rules.noLinkedPlatform') }}</span>
            </div>
          </div>

          <div class="mt-3">
            <p class="popup-muted-label mb-2 text-[11px]">{{ t('popup.rules.defaultPlatforms') }}</p>
            <div class="flex min-w-0 flex-wrap gap-1">
              <span
                v-for="label in defaultLabels"
                :key="label"
                class="popup-preview-tag"
              >
                {{ label }}
              </span>
              <span v-if="!defaultLabels.length" class="popup-muted-label text-xs">{{ t('popup.rules.noDefaultPlatform') }}</span>
            </div>
          </div>
      </div>
  </aside>
</template>
