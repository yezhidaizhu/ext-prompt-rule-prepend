<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { resolveDialogPortalTarget, setCreateDialogOpen } from '@/utils/content/dialogPortal';

const props = defineProps<{
  platformName: string;
  hint: string;
}>();

const emit = defineEmits<{
  close: [];
  create: [payload: { content: string; enabled: boolean }];
}>();

const content = ref('');
const enabled = ref(true);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const portalTarget = resolveDialogPortalTarget();

const canCreate = computed(() => content.value.trim().length > 0);
const dialogHint = computed(() => props.hint.trim() || `创建后将关联到 ${props.platformName}`);

onMounted(async () => {
  setCreateDialogOpen(true);
  await nextTick();
  textareaRef.value?.focus();
});

onBeforeUnmount(() => {
  setCreateDialogOpen(false);
});

function submit() {
  if (!canCreate.value) return;

  emit('create', {
    content: content.value.trim(),
    enabled: enabled.value,
  });
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
        aria-labelledby="prompt-rule-create-title"
        @click.stop
      >
        <header class="prompt-rule-create-header">
          <h3 id="prompt-rule-create-title" class="prompt-rule-create-title">添加规则</h3>
          <p class="prompt-rule-create-hint">{{ dialogHint }}</p>
        </header>

        <div class="prompt-rule-create-body">
          <textarea
            ref="textareaRef"
            v-model="content"
            class="prompt-rule-create-textarea"
            placeholder="输入规则内容"
            rows="5"
            @keydown="handleKeydown"
          />

          <label class="prompt-rule-create-switch-row">
            <span class="prompt-rule-create-switch-copy">
              <span class="prompt-rule-create-switch-label">创建后启用</span>
              <span class="prompt-rule-create-switch-desc">关闭后仅保存，不参与注入</span>
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
            取消
          </button>
          <button
            type="button"
            class="prompt-rule-create-button prompt-rule-create-button-primary"
            :disabled="!canCreate"
            @click="submit"
          >
            创建
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
