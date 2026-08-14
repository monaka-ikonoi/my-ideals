import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { type Profile, type ProfileFlag, type ProfileTemplateInfo } from '@/domain/profile';
import { getProfileStorage } from '@/storage/ProfileStorage';

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
  initialize: () => Promise<void>;
  createProfile: (
    name: string,
    templateInfo: ProfileTemplateInfo,
    flags?: ProfileFlag[]
  ) => Promise<string>;
  importProfile: (profile: Profile, overwrite: boolean) => Promise<string>;
  deleteProfile: (id: string) => Promise<void>;

  setActiveProfile: (id: string | null) => void;
  updateProfileName: (id: string, name: string) => void;
  reorderProfile: (id: string, direction: 'up' | 'down') => void;
};

export const useProfileListStore = create<ProfileListStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        profiles: [],
        activeId: null,
        isInitialized: false,

        initialize: async () => {
          const { profiles, activeId, isInitialized } = get();
          if (isInitialized) return;

          const existingIds = new Set(await getProfileStorage().listProfiles());
          const validProfiles = profiles.filter(p => {
            if (existingIds.has(p.id)) {
              existingIds.delete(p.id);
              return true;
            }
            console.warn(`Missing expected profile ${p.id}`);
            return false;
          });

          for (const id of existingIds) {
            const result = await getProfileStorage().getProfile(id);
            if (result.success) {
              validProfiles.push({ id, name: result.profile.name });
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

        createProfile: async (name, templateInfo, flags = []) => {
          const id = nanoid();
          const newProfile: Profile = {
            magic: 'my-ideals-profile',
            version: 1,
            id,
            name,
            template: templateInfo,
            flags,
            selectedMembers: [],
            collections: {},
            lastModified: Date.now(),
          };

          // Reset the revision to trigger a sync later
          newProfile.template.revision = 0;

          await getProfileStorage().setProfile(newProfile);

          set(state => {
            state.profiles.push({ id, name });
            state.activeId = id;
          });

          return id;
        },

        importProfile: async (profile, overwrite) => {
          const existingIndex = get().profiles.findIndex(p => p.id === profile.id);

          let finalProfile = profile;
          if (existingIndex >= 0 && !overwrite) {
            finalProfile = { ...profile, id: nanoid(), lastModified: Date.now() };
          }

          await getProfileStorage().setProfile(finalProfile);

          set(state => {
            if (existingIndex >= 0 && overwrite) {
              state.profiles.splice(existingIndex, 1);
            }
            state.profiles.push({ id: finalProfile.id, name: finalProfile.name });
          });

          return finalProfile.id;
        },

        deleteProfile: async id => {
          await getProfileStorage().deleteProfile(id);

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

        setActiveProfile: id => {
          set(state => {
            state.activeId = id;
          });
        },

        updateProfileName: (id, name) => {
          set(state => {
            const entry = state.profiles.find(p => p.id === id);
            if (entry) {
              entry.name = name;
            }
          });
        },

        reorderProfile: (id, direction) => {
          set(state => {
            const index = state.profiles.findIndex(p => p.id === id);
            if (index < 0) return;
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            if (swapIndex < 0 || swapIndex >= state.profiles.length) return;
            const temp = state.profiles[index];
            state.profiles[index] = state.profiles[swapIndex];
            state.profiles[swapIndex] = temp;
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
