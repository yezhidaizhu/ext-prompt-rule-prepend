import { onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import {
  observeRulesCollapse,
  updateFoldedRuleSummaryLabels,
  updateFoldedRuleTheme,
} from '@/utils/content/rulesCollapse';
import { usePromptConfigStore } from '@/stores/promptConfigStore';
import type { ContentPlatform } from './types';

export function useRulesCollapse(platform: ContentPlatform) {
  let cleanup = () => {};
  const { locale, t } = useI18n();
  const store = usePromptConfigStore();
  const { config } = storeToRefs(store);

  onMounted(() => {
    cleanup = observeRulesCollapse(
      () => platform.getConversationSelectors(),
      () => t('content.foldedRules'),
      () => config.value.settings.uiTheme,
    );
  });

  watch(locale, () => {
    updateFoldedRuleSummaryLabels(t('content.foldedRules'));
  });

  watch(
    () => config.value.settings.uiTheme,
    (theme) => {
      updateFoldedRuleTheme(theme);
    },
  );

  onUnmounted(() => {
    cleanup();
  });
}
