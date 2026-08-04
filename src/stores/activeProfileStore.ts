import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { ProfileFlags, profileHasFlag, type Profile, type ProfileFlag } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import { syncProfileWithTemplate, type ProfileTemplateDiff } from '@/utils/syncProfile';
import { loadActiveProfile, type LoadActiveProfileError } from '@/services/activeProfileLoader';
import { ProfileFlagOperations } from '@/utils/profileFlagOperation';

export type ActiveProfileLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: LoadActiveProfileError };

export type ActiveProfileState = {
  // State
  loadState: ActiveProfileLoadState;
  profile: Profile | null;
  template: Template | null;
  changes: ProfileTemplateDiff | null;
  pendingSync: boolean;

  // Actions
  load: (profileId: string) => Promise<void>;
  clear: () => Promise<void>;
  flush: () => Promise<void>;
  confirmSyncChanges: (cleanup: boolean) => Promise<void>;
  toggleStatus: (collectionId: string, itemId: string) => void;
  setCount: (collectionId: string, itemId: string, value: number) => void;
  toggleMember: (member: string) => void;
  updateName: (name: string) => void;
  updateTemplateInfo: (url: string, templateId?: string) => void;
  toggleFlag: (flag: ProfileFlag, enabled: boolean) => void;
};

export const useActiveProfileStore = create<ActiveProfileState>()(
  immer((set, get) => {
    const touch = (profile: Profile) => {
      profile.lastModified = Date.now();
    };

    const debouncedSave = debounce(async () => {
      const { profile } = get();
      if (!profile) return;

      await getProfileStorage().setProfile(profile);
      debugLog.store.log(`Profile ${profile.id} saved`);
    }, 500);

    return {
      loadState: { status: 'idle' },
      profile: null,
      template: null,
      changes: null,
      pendingSync: false,

      load: async (profileId: string) => {
        set(state => {
          state.loadState = { status: 'loading' };
        });

        await Promise.resolve(debouncedSave.flush());

        set(state => {
          state.profile = null;
          state.template = null;
          state.changes = null;
          state.pendingSync = false;
        });

        const result = await loadActiveProfile(profileId);

        set(state => {
          if (result.status === 'error') {
            state.loadState = { status: 'error', error: result.error };
            state.profile = result.profile ?? null;
            return;
          }

          state.loadState = { status: 'success' };
          state.profile = result.profile;
          state.template = result.template;
          state.changes = result.changes;
          state.pendingSync = result.pendingSync;
        });

        if (result.status === 'success') {
          debugLog.store.log(`Loaded profile ${result.profile.name}, ${profileId}`);
        }
      },

      clear: async () => {
        set(state => {
          state.loadState = { status: 'loading' };
        });

        await Promise.resolve(debouncedSave.flush());

        set(state => {
          state.loadState = { status: 'idle' };
          state.profile = null;
          state.template = null;
          state.changes = null;
          state.pendingSync = false;
        });
      },

      flush: async () => {
        await Promise.resolve(debouncedSave.flush());
      },

      confirmSyncChanges: async (cleanup: boolean) => {
        const { profile, template, pendingSync } = get();

        if (!profile || !template) return;

        if (!pendingSync) {
          set(state => {
            state.changes = null;
          });
          return;
        }

        const synced = syncProfileWithTemplate(profile, template, cleanup);
        touch(synced);
        await getProfileStorage().setProfile(synced);

        set(state => {
          state.profile = synced;
          state.changes = null;
          state.pendingSync = false;
        });
      },

      toggleStatus: (collectionId: string, itemId: string) => {
        set(state => {
          if (!state.profile) return;

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

          if (!state.profile) return;

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
          if (!state.profile) return;

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
          if (state.profile) {
            state.profile.name = name;
            touch(state.profile);
          }
        });
        debouncedSave();
      },

      updateTemplateInfo: (url: string, templateId?: string) => {
        set(state => {
          if (state.profile) {
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
          }
        });
        debouncedSave();
      },

      toggleFlag: (flag: ProfileFlag, enabled: boolean) => {
        set(state => {
          if (!state.profile) return;

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
