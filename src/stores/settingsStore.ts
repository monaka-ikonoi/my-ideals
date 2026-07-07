import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';
import type { BadgeProps } from '@/components/CountBadge';

export type ImageOptions = {
  badge: BadgeProps; // v2
  dimUntoggled: boolean; // v3
};

type SettingsStore = {
  // State
  language: string;
  disclaimerAccepted: boolean;
  storageBackend: StorageBackend; // v1
  imageOptions: ImageOptions;

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
  setImageOptions: (options: Partial<ImageOptions>) => void; // v2 / v3
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

      // v2 / v3
      imageOptions: { badge: { position: 'top-right', size: 'medium' }, dimUntoggled: true },
      setImageOptions: (options: Partial<ImageOptions>) => {
        set(state => ({ imageOptions: { ...state.imageOptions, ...options } }));
      },
    }),
    {
      name: 'my-ideals:settings',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsStore>;
        if (version === 0) {
          state.storageBackend = 'localStorage';
        }
        if (version < 2) {
          state.imageOptions = { badge: { position: 'top-right', size: 'medium' }, dimUntoggled: true };
        }
        if (version < 3) {
          state.imageOptions = {
            ...(state.imageOptions ?? { badge: { position: 'top-right', size: 'medium' } }),
            dimUntoggled: true,
          };
        }
        return state;
      },
    }
  )
);
