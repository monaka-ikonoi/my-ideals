import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { StorageBackend } from '@/storage/runtime';
import type { BadgeMap } from '@/components/card/BadgeProps';

export type ImageOptions = {
  dimUntoggled?: boolean; // v3
  flatten?: boolean; // v4
};

export const buildDefaultImageOptions = (): Required<ImageOptions> => ({
  dimUntoggled: true,
  flatten: false,
});

/** Image options that depend on a profile's fields, so they cannot be shared across profiles. */
export type ProfileOptions = {
  badges?: BadgeMap;
};

type SettingsStore = {
  // State
  language: string;
  disclaimerAccepted: boolean;
  storageBackend: StorageBackend; // v1
  imageOptions: Required<ImageOptions>; // v2
  itpWarningDismissed: boolean; // v5
  installBannerDismissed: boolean; // v5
  profileOptions: Record<string, ProfileOptions>; // v6

  // Actions
  setLanguage: (code: string) => void;
  setStorageBackend: (backend: StorageBackend) => void; // v1
  setImageOptions: (options: ImageOptions) => void; // v2 / v3 / v4
  dismissItpWarning: () => void; // v5
  dismissInstallBanner: () => void; // v5
  setProfileOptions: (profileId: string, options: ProfileOptions) => void; // v6
  clearProfileOptions: (profileId: string) => void; // v6
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

      // v6
      profileOptions: {},
      setProfileOptions: (profileId: string, options: ProfileOptions) => {
        set(state => ({
          profileOptions: {
            ...state.profileOptions,
            [profileId]: { ...state.profileOptions[profileId], ...options },
          },
        }));
      },
      clearProfileOptions: (profileId: string) => {
        set(state => ({
          profileOptions: Object.fromEntries(
            Object.entries(state.profileOptions).filter(([id]) => id !== profileId)
          ),
        }));
      },
    }),
    {
      name: 'my-ideals:settings',
      version: 6,
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
        if (version < 6) {
          state.profileOptions = {};
          state.imageOptions = {
            dimUntoggled: state.imageOptions?.dimUntoggled ?? true,
            flatten: state.imageOptions?.flatten ?? false,
          };
        }
        return state;
      },
    }
  )
);
