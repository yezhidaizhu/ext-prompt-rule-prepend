<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { resolveDialogPortalTarget, setCreateDialogOpen } from '@/utils/content/dialogPortal';

const props = withDefaults(defineProps<{
  mode?: 'create' | 'edit';
  platformName: string;
  hint: string;
  initialContent?: string;
  initialEnabled?: boolean;
}>(), {
  mode: 'create',
  initialContent: '',
  initialEnabled: true,
});

const emit = defineEmits<{
  close: [];
  create: [payload: { content: string; enabled: boolean }];
  save: [payload: { content: string; enabled: boolean }];
}>();

const content = ref('');
const enabled = ref(true);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const portalTarget = resolveDialogPortalTarget();
const { t } = useI18n();

const isEditMode = computed(() => props.mode === 'edit');
const dialogTitle = computed(() => (isEditMode.value ? t('content.createDialog.editTitle') : t('content.createDialog.createTitle')));
const submitLabel = computed(() => (isEditMode.value ? t('content.createDialog.save') : t('content.createDialog.create')));
const switchLabel = computed(() => (isEditMode.value ? t('content.createDialog.enableRule') : t('content.createDialog.enableAfterCreate')));
const switchDesc = computed(() =>
  isEditMode.value ? t('content.createDialog.editDisabledHint') : t('content.createDialog.createDisabledHint'));

const canSubmit = computed(() => content.value.trim().length > 0);
const dialogHint = computed(() => {
  if (props.hint.trim()) return props.hint.trim();
  return isEditMode.value
    ? t('content.createDialog.editHint', { platform: props.platformName })
    : t('content.createDialog.createHint', { platform: props.platformName });
});

function syncFromProps() {
  content.value = props.initialContent;
  enabled.value = props.initialEnabled;
}

onMounted(async () => {
  syncFromProps();
  setCreateDialogOpen(true);
  await nextTick();
  textareaRef.value?.focus();
});

watch(
  () => [props.initialContent, props.initialEnabled] as const,
  () => syncFromProps(),
);

onBeforeUnmount(() => {
  setCreateDialogOpen(false);
});

function submit() {
  if (!canSubmit.value) return;

  const payload = {
    content: content.value.trim(),
    enabled: enabled.value,
  };

  if (isEditMode.value) {
    emit('save', payload);
    return;
  }

  emit('create', payload);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return;
  if (!event.metaKey && !event.ctrlKey) return;

  event.preventDefault();
  submit();
}
</script>

<template>
  <Teleport :to="portalTarget">
    <div
      class="prompt-rule-create-overlay"
      @click.self="emit('close')"
    >
      <section
        class="prompt-rule-create-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="isEditMode ? 'prompt-rule-edit-title' : 'prompt-rule-create-title'"
        @click.stop
      >
        <header class="prompt-rule-create-header">
          <h3
            :id="isEditMode ? 'prompt-rule-edit-title' : 'prompt-rule-create-title'"
            class="prompt-rule-create-title"
          >
            {{ dialogTitle }}
          </h3>
          <p class="prompt-rule-create-hint">{{ dialogHint }}</p>
        </header>

        <div class="prompt-rule-create-body">
          <textarea
            ref="textareaRef"
            v-model="content"
            class="prompt-rule-create-textarea"
            :placeholder="t('content.createDialog.placeholder')"
            rows="6"
            @keydown="handleKeydown"
          />

          <label class="prompt-rule-create-switch-row">
            <span class="prompt-rule-create-switch-copy">
              <span class="prompt-rule-create-switch-label">{{ switchLabel }}</span>
              <span class="prompt-rule-create-switch-desc">{{ switchDesc }}</span>
            </span>
            <button
              type="button"
              class="prompt-rule-create-switch"
              :class="enabled ? 'is-on' : 'is-off'"
              :aria-pressed="enabled"
              @click="enabled = !enabled"
            >
              <span class="prompt-rule-create-switch-thumb" />
            </button>
          </label>
        </div>

        <footer class="prompt-rule-create-footer">
          <button
            type="button"
            class="prompt-rule-create-button prompt-rule-create-button-muted"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="prompt-rule-create-button prompt-rule-create-button-primary"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ submitLabel }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
