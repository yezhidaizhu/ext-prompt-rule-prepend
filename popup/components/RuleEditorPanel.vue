<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import '@/popup/styles/shared.css';

interface RuleEditorPlatform {
  id: string;
  name: string;
}

const props = defineProps<{
  mode: 'create' | 'edit';
  content: string;
  enabled: boolean;
  platformIds: string[];
  platforms: RuleEditorPlatform[];
}>();

const emit = defineEmits<{
  back: [];
  create: [];
  delete: [];
  'update:content': [value: string];
  'update:enabled': [value: boolean];
  togglePlatform: [platformId: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const { t } = useI18n();

onMounted(async () => {
  await nextTick();
  textareaRef.value?.focus();
});
</script>

<template>
  <section class="absolute inset-0 z-10 flex flex-col popup-panel-layer backdrop-blur-xl">
    <header class="popup-header border-b popup-divider">
      <button
        type="button"
        class="popup-icon-button popup-back-button popup-secondary-text popup-hover-primary"
        :title="t('common.back')"
        :aria-label="t('common.back')"
        @click="emit('back')"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" />
          <path d="m12 5-7 7 7 7" />
        </svg>
      </button>

      <h3 class="min-w-0 flex-1 px-2 text-sm font-semibold leading-none">
        {{ mode === 'create' ? t('popup.actions.newRule') : t('popup.rules.edit') }}
      </h3>

      <button
        v-if="mode === 'edit'"
        type="button"
        class="popup-icon-button popup-muted-label popup-hover-danger"
        :title="t('popup.rules.delete')"
        :aria-label="t('popup.rules.delete')"
        @click="emit('delete')"
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
        v-else
        type="button"
        class="popup-action-primary rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!content.trim()"
        @click="emit('create')"
      >
        {{ t('common.create') }}
      </button>
    </header>

    <div class="flex-1 overflow-y-auto popup-settings-scroll">
      <div class="popup-section border-b popup-divider py-3">
        <textarea
          ref="textareaRef"
          :value="content"
          class="popup-textarea min-h-40 w-full resize-none bg-transparent text-[13px] leading-5 popup-primary-text outline-none"
          :placeholder="t('popup.rules.placeholder')"
          @input="emit('update:content', ($event.target as HTMLTextAreaElement).value)"
          @keydown.meta.enter="mode === 'create' && emit('create')"
          @keydown.ctrl.enter="mode === 'create' && emit('create')"
        />
      </div>

      <div class="popup-section border-b popup-divider py-3">
        <p class="mb-2 text-[11px] font-medium popup-muted-label">{{ t('popup.rules.applicablePlatformTitle') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="platform in platforms"
            :key="platform.id"
            type="button"
            class="popup-platform-option"
            :class="
              platformIds.includes(platform.id)
                ? 'popup-platform-option-active'
                : 'popup-platform-option-inactive'
            "
            @click="emit('togglePlatform', platform.id)"
          >
            <span class="popup-platform-check">
              <svg v-if="platformIds.includes(platform.id)" class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 12 4 4 10-10" />
              </svg>
            </span>
            {{ platform.name }}
          </button>
        </div>
      </div>

      <div class="popup-setting-row border-b popup-divider">
        <div>
          <p class="text-[13px] font-medium popup-primary-text">{{ t('popup.rules.enableRule') }}</p>
          <p class="mt-0.5 text-xs popup-muted-label">{{ t('popup.rules.disabledInjectionHint') }}</p>
        </div>
        <button
          type="button"
          class="popup-switch"
          :class="enabled ? 'popup-switch-on' : 'popup-switch-off'"
          :aria-pressed="enabled"
          @click="emit('update:enabled', !enabled)"
        >
          <span class="popup-switch-thumb" />
        </button>
      </div>
    </div>
  </section>
</template>
