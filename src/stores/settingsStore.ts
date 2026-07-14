import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';
import type { BadgeProps } from '@/components/CountBadge';

export type ImageOptions = {
  badge?: BadgeProps; // v2
  dimUntoggled?: boolean; // v3
  flatten?: boolean; // v4
};

const buildDefaultImageOptions = (): Required<ImageOptions> => ({
  badge: { position: 'top-right', size: 'medium' },
  dimUntoggled: true,
  flatten: false,
});

type SettingsStore = {
  // State
  language: string;
  disclaimerAccepted: boolean;
  storageBackend: StorageBackend; // v1
  imageOptions: Required<ImageOptions>; // v2

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
  setImageOptions: (options: ImageOptions) => void; // v2 / v3 / v4
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

      // v2 / v3 / v4
      imageOptions: buildDefaultImageOptions(),
      setImageOptions: (options: ImageOptions) => {
        set(state => ({ imageOptions: { ...state.imageOptions, ...options } }));
      },
    }),
    {
      name: 'my-ideals:settings',
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsStore>;
        if (version === 0) {
          state.storageBackend = 'localStorage';
        }
        if (version < 2) {
          state.imageOptions = buildDefaultImageOptions();
        }
        if (version < 3) {
          state.imageOptions = {
            ...(state.imageOptions ?? buildDefaultImageOptions()),
            dimUntoggled: true,
          };
        }
        if (version < 4) {
          state.imageOptions = {
            ...(state.imageOptions ?? buildDefaultImageOptions()),
            flatten: false,
          };
        }
        return state;
      },
    }
  )
);
