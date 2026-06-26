<script setup lang="ts">
import { ref } from 'vue';
import PromptRuleToggle from '@/content/components/PromptRuleToggle.vue';
import PopupSettingsPanel from '@/popup/components/PopupSettingsPanel.vue';

const message = ref('');
</script>

<template>
  <main class="min-h-screen bg-[#111214] px-6 py-10 text-zinc-100">
    <PopupSettingsPanel preview />

    <section class="mx-auto flex min-h-[calc(100vh-80px)] max-w-[820px] flex-col justify-end">
      <div class="mb-48 text-center">
        <h1 class="text-2xl font-semibold">使用快速模式开始对话</h1>
        <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b1c1f] p-1 text-sm text-zinc-300">
          <button class="grid size-9 place-items-center rounded-full bg-blue-500/20 text-blue-300" aria-label="快速模式">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
              <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
            </svg>
          </button>
          <button class="grid size-9 place-items-center rounded-full text-zinc-400" aria-label="专家模式">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
              <path d="M12 3v18" />
              <path d="M3 12h18" />
            </svg>
          </button>
          <button class="grid size-9 place-items-center rounded-full text-zinc-400" aria-label="识图模式">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
              <circle cx="12" cy="12" r="7" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </button>
        </div>
      </div>

      <div class="relative">
        <div class="relative flex items-end gap-3">
          <div class="absolute bottom-[82px] left-0 z-10">
            <PromptRuleToggle platform-id="deepseek" />
          </div>

          <textarea
            v-model="message"
            class="min-h-31 flex-1 resize-none rounded-3xl border border-white/8 bg-[#252628] px-5 py-4 text-base leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500/60"
            placeholder="给 DeepSeek 发送消息"
          />

          <button
            type="button"
            class="absolute bottom-5 right-4 grid size-9 place-items-center rounded-full bg-blue-500/70 text-xl text-blue-100 transition hover:bg-blue-500"
            aria-label="发送"
          >
            ↑
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
