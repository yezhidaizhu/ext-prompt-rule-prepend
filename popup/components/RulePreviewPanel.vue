<script setup lang="ts">
import { computed, ref } from 'vue';
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
        <h3 class="text-sm font-semibold leading-none">规则内容</h3>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="popup-icon-button popup-hover-primary"
            :class="copied ? 'popup-accent-text' : 'popup-secondary-text'"
            :title="copied ? '已复制' : '复制'"
            :aria-label="copied ? '已复制' : '复制'"
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
            title="关闭"
            aria-label="关闭"
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
          {{ rule.content || '未命名规则' }}
        </p>
      </div>

      <div class="popup-section popup-divider shrink-0 border-t py-2.5">
          <div class="flex items-center justify-between gap-3">
            <span class="popup-muted-label shrink-0 text-[11px]">状态</span>
            <span class="truncate text-right text-xs" :class="rule.enabled ? 'popup-accent-text' : 'popup-danger-text'">
              {{ rule.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>

          <div class="mt-3">
            <p class="popup-muted-label mb-2 text-[11px]">适用平台</p>
            <div class="flex min-w-0 flex-wrap gap-1">
              <span
                v-for="platform in matchedPlatforms"
                :key="platform.id"
                class="popup-preview-tag"
              >
                {{ platform.name }}
              </span>
              <span v-if="!matchedPlatforms.length" class="popup-muted-label text-xs">未关联平台</span>
            </div>
          </div>

          <div class="mt-3">
            <p class="popup-muted-label mb-2 text-[11px]">默认注入平台</p>
            <div class="flex min-w-0 flex-wrap gap-1">
              <span
                v-for="label in defaultLabels"
                :key="label"
                class="popup-preview-tag"
              >
                {{ label }}
              </span>
              <span v-if="!defaultLabels.length" class="popup-muted-label text-xs">未设为平台默认</span>
            </div>
          </div>
      </div>
  </aside>
</template>
