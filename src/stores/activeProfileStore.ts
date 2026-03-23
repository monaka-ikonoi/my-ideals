import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { ProfileFlags, profileHasFlag, type Profile, type ProfileFlag } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import {
  diffProfileWithTemplate,
  syncProfileWithTemplate,
  type ProfileTemplateDiff,
} from '@/utils/syncProfile';
import { fetchTemplate, formatTemplateError } from '@/utils/fetchTemplate';
import { ProfileFlagOperations } from '@/utils/profileFlagOperation';
import { applyTemplateMigrations } from '@/utils/templateMigration';

export type LoadError =
  | { type: 'template'; message: string }
  | { type: 'profile'; message: string };

type activeProfileStore = {
  // State
  profile: Profile | null;
  template: Template | null;
  changes: ProfileTemplateDiff | null;
  pendingSync: boolean;
  isLoading: boolean;
  error: LoadError | null;

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

export const useActiveProfileStore = create<activeProfileStore>()(
  immer((set, get) => {
    const debouncedSave = debounce(async () => {
      const { profile } = get();
      if (!profile) return;

      await getProfileStorage().setProfile(profile);
      debugLog.store.log(`Profile ${profile.id} saved`);
    }, 500);

    return {
      profile: null,
      template: null,
      changes: null,
      isLoading: false,
      pendingSync: false,
      error: null,

      load: async (profileId: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        await Promise.resolve(debouncedSave.flush());

        set(state => {
          state.profile = null;
          state.template = null;
          state.changes = null;
          state.pendingSync = false;
        });

        const setError = (
          type: Exclude<LoadError, null>['type'],
          message: string,
          profile: Profile | null = null
        ) => {
          debugLog.store.log(`Failed to load ${type}: ${message}`);
          set(state => {
            state.error = { type, message: `${type}: ${message}` };
            state.profile = profile;
            state.isLoading = false;
          });
        };

        let profile = await getProfileStorage().getProfile(profileId);
        if (!profile) {
          setError('profile', `Unable to load Profile ${profileId}`);
          return;
        }

        const templateResult = await fetchTemplate(profile.template.link, profile.template.id);
        if (!templateResult.success) {
          setError('template', formatTemplateError(templateResult.error), profile);
          return;
        }
        if (profile.template.link !== templateResult.url) {
          debugLog.store.log(
            `Template link updated from ${profile.template.link} to ${templateResult.url}`
          );
          profile.template.link = templateResult.url;
          await getProfileStorage().setProfile(profile);
        }
        const template = templateResult.template;

        let changes: ProfileTemplateDiff | null = null;
        let pendingSync = false;
        if (profile.template.revision !== template.revision) {
          if (profile.template.revision !== 0) {
            applyTemplateMigrations(profile, template);
            changes = diffProfileWithTemplate(profile, template);
            pendingSync = changes.removed.length > 0;
          }
          if (!pendingSync) {
            profile = syncProfileWithTemplate(profile, template, false);
            await getProfileStorage().setProfile(profile);
          }
        }

        set(state => {
          state.profile = profile;
          state.template = template;
          state.changes = changes;
          state.pendingSync = pendingSync;
          state.isLoading = false;
        });

        debugLog.store.log(`Loaded profile ${profile.name}, ${profileId}`);
      },

      clear: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        await Promise.resolve(debouncedSave.flush());

        set(state => {
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
        });
        debouncedSave();
      },

      updateName: (name: string) => {
        set(state => {
          if (state.profile) {
            state.profile.name = name;
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
          debugLog.perf.timeEnd(`Toggle flag ${flag} to ${enabled}`);

          debugLog.store.log(`Profile ${state.profile.id} flag ${flag} toggled to ${enabled}`);
        });
        debouncedSave();
      },
    };
  })
);
