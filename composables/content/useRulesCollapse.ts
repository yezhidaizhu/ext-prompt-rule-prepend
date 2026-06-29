import { onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { observeRulesCollapse, updateFoldedRuleSummaryLabels } from '@/utils/content/rulesCollapse';
import type { ContentPlatform } from './types';

export function useRulesCollapse(platform: ContentPlatform) {
  let cleanup = () => {};
  const { locale, t } = useI18n();

  onMounted(() => {
    cleanup = observeRulesCollapse(
      () => platform.getConversationSelectors(),
      () => t('content.foldedRules'),
    );
  });

  watch(locale, () => {
    updateFoldedRuleSummaryLabels(t('content.foldedRules'));
  });

  onUnmounted(() => {
    cleanup();
  });
}
