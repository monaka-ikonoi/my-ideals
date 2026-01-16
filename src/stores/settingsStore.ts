import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

type SettingsStore = {
  // State
  language: string;

  // Actions
  setLanguage: (code: string) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      language: navigator.language.split('-')[0] || 'en',

      setLanguage: (code: string) => {
        i18n.changeLanguage(code);
        set({ language: code });
      },
    }),
    {
      name: 'my-ideals:settings',
    }
  )
);
