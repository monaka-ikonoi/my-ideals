import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import { useSettingsStore } from '@/stores/settingsStore';

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
};

i18n.use(initReactI18next).init({
  resources,
  lng: useSettingsStore.getState().language,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const supportedLanguages = Object.keys(resources) as (keyof typeof resources)[];

export default i18n;
