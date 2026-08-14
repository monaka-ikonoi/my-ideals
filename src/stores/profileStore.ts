import { createStore, type StoreApi } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { ProfileFlags, profileHasFlag, type Profile, type ProfileFlag } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import { syncProfileWithTemplate } from '@/utils/syncProfile';
import { ProfileFlagOperations } from '@/utils/profileFlagOperation';

export type LoadedProfile = {
  profile: Profile;
  template: Template | null;
};

export type ProfileState = LoadedProfile & {
  flush: () => Promise<void>;
  syncWithTemplate: (cleanup: boolean) => Promise<void>;
  toggleStatus: (collectionId: string, itemId: string) => void;
  setCount: (collectionId: string, itemId: string, value: number) => void;
  toggleMember: (member: string) => void;
  updateName: (name: string) => void;
  updateTemplateInfo: (url: string, templateId?: string) => void;
  toggleFlag: (flag: ProfileFlag, enabled: boolean) => void;
};

export type ProfileStore = StoreApi<ProfileState>;

export function createProfileStore(loaded: LoadedProfile): ProfileStore {
  return createStore<ProfileState>()(
    immer((set, get) => {
      const touch = (profile: Profile) => {
        profile.lastModified = Date.now();
      };

      const debouncedSave = debounce(async () => {
        const { profile } = get();
        await getProfileStorage().setProfile(profile);
        debugLog.store.log(`Profile ${profile.id} saved`);
      }, 500);

      return {
        profile: loaded.profile,
        template: loaded.template,

        flush: async () => {
          await Promise.resolve(debouncedSave.flush());
        },

        syncWithTemplate: async (cleanup: boolean) => {
          const { profile, template } = get();
          if (!template) return;

          const synced = syncProfileWithTemplate(profile, template, cleanup);
          touch(synced);
          await getProfileStorage().setProfile(synced);

          set(state => {
            state.profile = synced;
          });
        },

        toggleStatus: (collectionId: string, itemId: string) => {
          set(state => {
            if (profileHasFlag(state.profile, ProfileFlags.ENABLE_COUNT)) return;

            if (!state.profile.collections[collectionId]) {
              state.profile.collections[collectionId] = {};
            }

            const current = state.profile.collections[collectionId][itemId] ?? false;
            state.profile.collections[collectionId][itemId] = !current;
            touch(state.profile);
          });

          debouncedSave();
        },

        setCount: (collectionId: string, itemId: string, value: number) => {
          set(state => {
            if (!Number.isInteger(value)) return;

            if (!profileHasFlag(state.profile, ProfileFlags.ENABLE_COUNT)) return;

            if (!state.profile.collections[collectionId]) {
              state.profile.collections[collectionId] = {};
            }
            state.profile.collections[collectionId][itemId] = value;
            touch(state.profile);
          });

          debouncedSave();
        },

        toggleMember: (member: string) => {
          set(state => {
            const selectedMembers = state.profile.selectedMembers;
            if (selectedMembers.includes(member)) {
              state.profile.selectedMembers = selectedMembers.filter(m => m !== member);
            } else {
              state.profile.selectedMembers = [...selectedMembers, member];
            }
            touch(state.profile);
          });
          debouncedSave();
        },

        updateName: (name: string) => {
          set(state => {
            state.profile.name = name;
            touch(state.profile);
          });
          debouncedSave();
        },

        updateTemplateInfo: (url: string, templateId?: string) => {
          set(state => {
            state.profile.template.link = url;
            debugLog.store.log(`Profile ${state.profile.id} template link updated to ${url}`);
            if (templateId && state.profile.template.id !== templateId) {
              state.profile.template.id = templateId;
              state.profile.template.revision = -1; // Force sync
              debugLog.store.log(
                `Profile ${state.profile.id} template id updated to ${templateId} forcefully`
              );
            }
            touch(state.profile);
          });
          debouncedSave();
        },

        toggleFlag: (flag: ProfileFlag, enabled: boolean) => {
          set(state => {
            const flags = state.profile.flags ?? [];
            const hasFlag = flags.includes(flag);
            if (enabled === hasFlag) return;

            debugLog.perf.time(`Toggle flag ${flag} to ${enabled}`);
            state.profile.flags = enabled ? [...flags, flag] : flags.filter(f => f !== flag);
            ProfileFlagOperations.get(flag)?.get(enabled)?.(state.profile);
            touch(state.profile);
            debugLog.perf.timeEnd(`Toggle flag ${flag} to ${enabled}`);
            debugLog.store.log(`Profile ${state.profile.id} flag ${flag} toggled to ${enabled}`);
          });
          debouncedSave();
        },
      };
    })
  );
}
