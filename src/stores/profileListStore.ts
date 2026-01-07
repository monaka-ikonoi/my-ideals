import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { type Profile } from '@/domain/profile';
import { ProfileStorage } from '@/storage/profileStorage';

export type ProfileListEntry = {
  id: string;
  name: string;
};

type ProfileListStore = {
  // State
  activeId: string | null;
  profiles: ProfileListEntry[];
  isInitialized: boolean;

  // Computed
  activeProfile: ProfileListEntry | null;

  // Actions
  initialize: () => void;
  setActiveProfile: (id: string | null) => void;
  createProfile: (name: string, templateId: string, templateLink: string) => string;
  importProfile: (profile: Profile, overwrite: boolean) => string;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
};

export const useProfileListStore = create<ProfileListStore>()(
  persist(
    immer((set, get) => ({
      profiles: [],
      activeId: null,
      isInitialized: false,

      initialize: () => {
        const { profiles, isInitialized } = get();
        if (isInitialized) return;

        if (profiles.length > 0) {
          set(state => {
            state.isInitialized = true;
          });
          return;
        }

        const scanned = ProfileStorage.scanProfiles();
        set(state => {
          state.profiles = scanned;
          state.activeId = scanned[0]?.id ?? null;
          state.isInitialized = true;
        });
      },

      get activeProfile() {
        const { profiles, activeId } = get();
        return profiles.find(p => p.id === activeId) ?? null;
      },

      setActiveProfile: id => {
        set(state => {
          state.activeId = id;
        });
      },

      createProfile: (_name, _templateId, _templateLink) => {
        return '';
      },

      importProfile: (profile, overwrite) => {
        const existingIndex = get().profiles.findIndex(p => p.id === profile.id);

        let finalProfile = profile;
        if (existingIndex >= 0 && !overwrite) {
          finalProfile = { ...profile, id: nanoid() };
        }

        ProfileStorage.setProfile(finalProfile);

        set(state => {
          if (existingIndex >= 0 && overwrite) {
            state.profiles.splice(existingIndex, 1);
          }
          state.profiles.push({ id: finalProfile.id, name: finalProfile.name });
          state.activeId = finalProfile.id;
        });

        return finalProfile.id;
      },

      deleteProfile: id => {
        ProfileStorage.deleteProfile(id);

        set(state => {
          const index = state.profiles.findIndex(p => p.id === id);
          if (index >= 0) {
            state.profiles.splice(index, 1);
          }

          if (state.activeId === id) {
            state.activeId = state.profiles[0]?.id ?? null;
          }
        });
      },

      renameProfile: (id, name) => {
        const profile = ProfileStorage.getProfile(id);
        if (profile) {
          profile.name = name;
          ProfileStorage.setProfile(profile);
        }

        set(state => {
          const summary = state.profiles.find(p => p.id === id);
          if (summary) {
            summary.name = name;
          }
        });
      },
    })),
    {
      name: 'my-ideals:profile-list',
      partialize: state => ({
        profiles: state.profiles,
        active: state.activeId,
      }),
    }
  )
);
