<script setup lang="ts">
import PromptRuleToggle from '@/content/components/PromptRuleToggle.vue';
import { useBeforeSend } from '@/composables/content/useBeforeSend';
import { useContentPlatform } from '@/composables/content/useContentPlatform';
import { useInjectionLifecycle } from '@/composables/content/useInjectionLifecycle';
import { useRulesCollapse } from '@/composables/content/useRulesCollapse';
import { useTogglePosition } from '@/composables/content/useTogglePosition';
import '@/content/styles/shadow-host.css';

const props = defineProps<{
  platformId: string;
}>();

const platform = useContentPlatform(props.platformId);
const { hostStyle } = useTogglePosition(platform);
const { disableInjection } = useInjectionLifecycle(platform);

useBeforeSend(platform, {
  onInjected: disableInjection,
});
useRulesCollapse(platform);
</script>

<template>
  <div :style="hostStyle">
    <PromptRuleToggle :platform-id="platformId" />
  </div>
</template>
