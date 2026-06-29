<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { PopupPlatform } from '@/types/promptConfig';
import EmptyListIcon from '@/shared/components/EmptyListIcon.vue';

defineProps<{
  platforms: PopupPlatform[];
}>();

const emit = defineEmits<{
  edit: [platformId: string];
  toggleEnabled: [platformId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="!platforms.length" class="popup-empty-state">
    <EmptyListIcon class="popup-muted-label" />
    <p class="mt-2 text-[13px] font-medium popup-secondary-text">{{ t('popup.platforms.empty') }}</p>
  </div>

  <div
    v-for="platform in platforms"
    :key="platform.id"
    class="border-b popup-divider"
  >
    <div class="popup-list-row">
      <p class="min-w-0 flex-1 truncate text-[13px] popup-primary-text">{{ platform.name }}</p>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="popup-icon-button"
          :class="platform.enabled ? 'popup-accent-text' : 'popup-danger-text'"
          :title="platform.enabled ? t('popup.platforms.disable') : t('popup.platforms.enable')"
          :aria-label="platform.enabled ? t('popup.platforms.disable') : t('popup.platforms.enable')"
          @click="emit('toggleEnabled', platform.id)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v8" />
            <path d="M7.05 6.35a8 8 0 1 0 9.9 0" />
            <path v-if="!platform.enabled" d="M4 4l16 16" />
          </svg>
        </button>

        <button
          type="button"
          class="popup-icon-button popup-muted-label popup-hover-primary"
          :title="t('popup.platforms.edit')"
          :aria-label="t('popup.platforms.edit')"
          @click="emit('edit', platform.id)"
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
