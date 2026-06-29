import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    action: {
      default_title: '__MSG_extName__',
    },
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: ['*://chat.deepseek.com/*', '*://chatgpt.com/*'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
