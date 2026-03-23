import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';

type SettingsStore = {
  // State
  language: string;
  disclaimerAccepted: boolean;
  storageBackend: StorageBackend; // v1

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      language: navigator.language.split('-')[0] || 'en',
      disclaimerAccepted: false,

      setLanguage: (code: string) => {
        i18n.changeLanguage(code);
        set({ language: code });
      },

      // v1
      storageBackend: 'indexedDb',
      setStorageBackend: (backend: StorageBackend) => {
        set({ storageBackend: backend });
      },
    }),
    {
      name: 'my-ideals:settings',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsStore>;
        if (version === 0) {
          state.storageBackend = 'localStorage';
        }
        return state;
      },
    }
  )
);
