import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import { createAppI18n } from '@/i18n';

const app = createApp(App);
app.use(createPinia());
app.use(createAppI18n());
app.mount('#app');
