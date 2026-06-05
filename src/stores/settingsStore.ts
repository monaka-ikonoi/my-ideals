import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';
import type { BadgeProps } from '@/components/CountBadge';

type SettingsStore = {
  // State
  language: string;
  disclaimerAccepted: boolean;
  storageBackend: StorageBackend; // v1
  imageOptions: {
    badge: BadgeProps; // v2
  };

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
  setBadgeOptions: (badge: BadgeProps) => void; // v2
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

      // v2
      imageOptions: { badge: { position: 'top-right', size: 'medium' } },
      setBadgeOptions: (badge: BadgeProps) => {
        set(state => ({ imageOptions: { ...state.imageOptions, badge } }));
      },
    }),
    {
      name: 'my-ideals:settings',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsStore>;
        if (version === 0) {
          state.storageBackend = 'localStorage';
        }
        if (version < 2) {
          state.imageOptions = { badge: { position: 'top-right', size: 'medium' } };
        }
        return state;
      },
    }
  )
);
