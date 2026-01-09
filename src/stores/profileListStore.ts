import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { type Profile, type ProfileTemplateInfo } from '@/domain/profile';
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

  // Actions
  initialize: () => void;
  setActiveProfile: (id: string | null) => void;
  createProfile: (name: string, templateInfo: ProfileTemplateInfo) => string;
  importProfile: (profile: Profile, overwrite: boolean) => string;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
};

export const useProfileListStore = create<ProfileListStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        profiles: [],
        activeId: null,
        isInitialized: false,

        initialize: () => {
          const { profiles, activeId, isInitialized } = get();
          if (isInitialized) return;

          const existingIds = new Set(ProfileStorage.listProfiles());
          const validProfiles = profiles.filter(p => {
            if (existingIds.has(p.id)) {
              existingIds.delete(p.id);
              return true;
            }
            console.warn(`Missing expected profile ${p.id}`);
            return false;
          });

          for (const id of existingIds) {
            const profile = ProfileStorage.getProfile(id);
            if (profile) {
              validProfiles.push({ id, name: profile.name });
              console.log(`Found unrecorded profile ${id}`);
            }
          }

          const validActiveId = validProfiles.some(p => p.id === activeId)
            ? activeId
            : (validProfiles[0]?.id ?? null);

          set(state => {
            state.profiles = validProfiles;
            state.activeId = validActiveId;
            state.isInitialized = true;
          });
        },

        setActiveProfile: id => {
          set(state => {
            state.activeId = id;
          });
        },

        createProfile: (name, templateInfo) => {
          const id = nanoid();
          const newProfile: Profile = {
            magic: 'my-ideals-profile',
            version: 1,
            id,
            name,
            template: templateInfo,
            collections: {},
          };

          // Reset the revision to trigger a sync later
          newProfile.template.revision = 0;

          ProfileStorage.setProfile(newProfile);

          set(state => {
            state.profiles.push({ id, name });
            state.activeId = id;
          });

          return id;
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
          set(state => {
            const entry = state.profiles.find(p => p.id === id);
            if (entry) {
              entry.name = name;
            }
          });
        },
      })),
      {
        name: 'my-ideals:profile-list',
        partialize: state => ({
          profiles: state.profiles,
          activeId: state.activeId,
        }),
      }
    )
  )
);
