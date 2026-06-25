import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'AI 指令规则助手',
    description:
      '在 AI 聊天发送前自动注入自定义指令与规则，弥补平台缺少系统提示词的不足。支持 DeepSeek、ChatGPT、Claude 等多平台管理。',
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: ['*://chat.deepseek.com/*'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
