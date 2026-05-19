import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { toast } from 'sonner';
import { t } from 'i18next';
import { ProfileFlags, profileHasFlag, type Profile, type ProfileFlag } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import {
  diffProfileWithTemplate,
  syncProfileWithTemplate,
  type ProfileTemplateDiff,
} from '@/utils/syncProfile';
import {
  fetchTemplateWithCache,
  formatTemplateError,
  type RevalidateErrorReason,
} from '@/utils/fetchTemplate';
import { ProfileFlagOperations } from '@/utils/profileFlagOperation';
import { applyTemplateMigrations } from '@/utils/templateMigration';

export type LoadError =
  | { type: 'template'; message: string }
  | { type: 'profile'; message: string };

export type LoadOptions = {
  /**
   * When true, skip the cache and force a network round-trip. The current
   * profile/template state is preserved while the request is in flight
   * (no loading flash); only `isRefreshing` is toggled.
   */
  forceNetwork?: boolean;
};

type activeProfileStore = {
  // State
  profile: Profile | null;
  template: Template | null;
  changes: ProfileTemplateDiff | null;
  pendingSync: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: LoadError | null;

  // Actions
  load: (profileId: string, opts?: LoadOptions) => Promise<void>;
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
    const touch = (profile: Profile) => {
      profile.lastModified = Date.now();
    };

    const debouncedSave = debounce(async () => {
      const { profile } = get();
      if (!profile) return;

      await getProfileStorage().setProfile(profile);
      debugLog.store.log(`Profile ${profile.id} saved`);
    }, 500);

    /**
     * Runs the migration → diff → sync pipeline against the given template.
     * Mirrors what `load()` historically did inline. When `persist` is true
     * and the sync produces a new profile object (i.e. no pendingSync), the
     * profile is written to storage.
     */
    const applySyncPipeline = async (
      profileInput: Profile,
      template: Template,
      persist: boolean
    ): Promise<{
      profile: Profile;
      changes: ProfileTemplateDiff | null;
      pendingSync: boolean;
    }> => {
      let profile = profileInput;
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
          touch(profile);
          if (persist) await getProfileStorage().setProfile(profile);
        }
      }
      return { profile, changes, pendingSync };
    };

    /**
     * Invoked when a background SWR revalidate returns fresh content.
     * Re-runs the sync pipeline against the latest persisted profile and
     * pushes the result into state — same as `load()`'s synchronous path.
     * If the active profile has changed in the meantime, the update is
     * dropped.
     */
    const handleRevalidated = async (
      profileId: string,
      newTemplate: Template,
      newUrl: string
    ): Promise<void> => {
      const current = get();
      if (!current.profile || current.profile.id !== profileId) {
        debugLog.cache.log(
          `revalidated template arrived for ${profileId} but profile is no longer active`
        );
        return;
      }

      let profile = await getProfileStorage().getProfile(profileId);
      if (!profile) return;

      if (profile.template.link !== newUrl) {
        profile.template.link = newUrl;
        touch(profile);
        await getProfileStorage().setProfile(profile);
      }

      const synced = await applySyncPipeline(profile, newTemplate, /* persist */ true);
      profile = synced.profile;

      // Re-check after the await: the active profile may have changed.
      if (get().profile?.id !== profileId) return;

      set(state => {
        state.profile = profile;
        state.template = newTemplate;
        state.changes = synced.changes;
        state.pendingSync = synced.pendingSync;
      });
      debugLog.cache.log(`SWR state updated for profile ${profileId}`);
    };

    const handleRevalidateError = (reason: RevalidateErrorReason): void => {
      if (reason.kind === 'gone') {
        toast.error(t('toast.template-gone', { status: reason.status }));
      }
      // 'silent' kind: cache + debug log are sufficient.
    };

    return {
      profile: null,
      template: null,
      changes: null,
      isLoading: false,
      isRefreshing: false,
      pendingSync: false,
      error: null,

      load: async (profileId: string, opts: LoadOptions = {}) => {
        const { forceNetwork = false } = opts;
        const isRefresh = forceNetwork && get().profile?.id === profileId;

        if (isRefresh) {
          set(state => {
            state.isRefreshing = true;
            state.error = null;
          });
        } else {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });
        }

        await Promise.resolve(debouncedSave.flush());

        if (!isRefresh) {
          set(state => {
            state.profile = null;
            state.template = null;
            state.changes = null;
            state.pendingSync = false;
          });
        }

        const setError = (
          type: Exclude<LoadError, null>['type'],
          message: string,
          profile: Profile | null = null
        ) => {
          debugLog.store.log(`Failed to load ${type}: ${message}`);
          set(state => {
            state.error = { type, message: `${type}: ${message}` };
            if (!isRefresh) state.profile = profile;
            state.isLoading = false;
            state.isRefreshing = false;
          });
        };

        let profile = await getProfileStorage().getProfile(profileId);
        if (!profile) {
          setError('profile', `Unable to load Profile ${profileId}`);
          return;
        }

        const templateResult = await fetchTemplateWithCache(
          profile.template.link,
          profile.template.id,
          {
            forceNetwork,
            onRevalidated: (newTemplate, newUrl) => {
              void handleRevalidated(profileId, newTemplate, newUrl);
            },
            onRevalidateError: reason => {
              handleRevalidateError(reason);
            },
          }
        );
        if (!templateResult.success) {
          setError('template', formatTemplateError(templateResult.error), profile);
          return;
        }
        if (profile.template.link !== templateResult.url) {
          debugLog.store.log(
            `Template link updated from ${profile.template.link} to ${templateResult.url}`
          );
          profile.template.link = templateResult.url;
          touch(profile);
          await getProfileStorage().setProfile(profile);
        }
        const template = templateResult.template;

        const synced = await applySyncPipeline(profile, template, /* persist */ true);

        set(state => {
          state.profile = synced.profile;
          state.template = template;
          state.changes = synced.changes;
          state.pendingSync = synced.pendingSync;
          state.isLoading = false;
          state.isRefreshing = false;
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
          state.isRefreshing = false;
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
