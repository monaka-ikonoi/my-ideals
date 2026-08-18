import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';
import type { BadgeProps } from '@/components/card/CountBadgeProps';

export type ImageOptions = {
  badge?: BadgeProps; // v2
  dimUntoggled?: boolean; // v3
  flatten?: boolean; // v4
};

export const buildDefaultImageOptions = (): Required<ImageOptions> => ({
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
  itpWarningDismissed: boolean; // v5
  installBannerDismissed: boolean; // v5

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
  setImageOptions: (options: ImageOptions) => void; // v2 / v3 / v4
  dismissItpWarning: () => void; // v5
  dismissInstallBanner: () => void; // v5
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

      // v5
      itpWarningDismissed: false,
      dismissItpWarning: () => set({ itpWarningDismissed: true }),
      installBannerDismissed: false,
      dismissInstallBanner: () => set({ installBannerDismissed: true }),
    }),
    {
      name: 'my-ideals:settings',
      version: 5,
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
        if (version < 5) {
          state.itpWarningDismissed = false;
          state.installBannerDismissed = false;
        }
        return state;
      },
    }
  )
);
