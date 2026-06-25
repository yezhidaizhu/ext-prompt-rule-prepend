<script setup lang="ts">
import PromptRuleToggle from '@/content/components/PromptRuleToggle.vue';
import { useBeforeSend } from '@/composables/content/useBeforeSend';
import { useContentPlatform } from '@/composables/content/useContentPlatform';
import { useRulesCollapse } from '@/composables/content/useRulesCollapse';
import { useTogglePosition } from '@/composables/content/useTogglePosition';
import '@/content/styles/shadow-host.css';

const props = defineProps<{
  platformId: string;
}>();

const platform = useContentPlatform(props.platformId);
const { hostStyle, toggleVisible } = useTogglePosition(platform);

useBeforeSend(platform);
useRulesCollapse(platform);
</script>

<template>
  <div :style="hostStyle">
    <PromptRuleToggle v-if="toggleVisible" />
  </div>
</template>
