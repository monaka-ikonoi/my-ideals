import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { type Profile } from '@/domain/profile';
import { TemplateSchema, type Template } from '@/domain/template';
import { ProfileStorage } from '@/storage/profileStorage';
import { useProfileListStore } from './profileListStore';
import { debugLog } from '@/utils/debug';
import {
  diffProfileWithTemplate,
  syncProfileWithTemplate,
  type ProfileTemplateDiff,
} from '@/utils/syncProfile';

type activeProfileStore = {
  // State
  profile: Profile | null;
  template: Template | null;
  changes: ProfileTemplateDiff | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  load: (profileId: string) => Promise<void>;
  clear: () => void;
  flush: () => void;
  toggleStatus: (collectionId: string, itemId: string) => void;
  toggleMember: (member: string) => void;
  updateName: (name: string) => void;
};

export const useActiveProfileStore = create<activeProfileStore>()(
  immer((set, get) => {
    const debouncedSave = debounce(() => {
      const { profile } = get();
      if (!profile) return;

      ProfileStorage.setProfile(profile);
      debugLog.store.log(`Profile ${profile.id} saved`);
    }, 500);

    return {
      profile: null,
      template: null,
      changes: null,
      isLoading: false,
      error: null,

      load: async (profileId: string) => {
        debouncedSave.flush();

        set(state => {
          state.profile = null;
          state.template = null;
          state.changes = null;
          state.isLoading = true;
          state.error = null;
        });

        try {
          let profile = ProfileStorage.getProfile(profileId);
          if (!profile) throw new Error('Profile not found');

          const res = await fetch(profile.template.link);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const template = TemplateSchema.parse(await res.json());
          if (template.id !== profile.template.id) {
            throw Error(
              `Template mismatch. Expected "${profile.template.id}" but got "${template.id}".`
            );
          }

          let changes: ProfileTemplateDiff | null = null;
          if (profile.template.revision !== template.revision) {
            if (profile.template.revision !== 0) {
              changes = diffProfileWithTemplate(profile, template);
            }
            profile = syncProfileWithTemplate(profile, template);
            ProfileStorage.setProfile(profile);
            console.log(`Profile updated to template rev ${template.revision}`);
          }

          set(state => {
            state.profile = profile;
            state.template = template;
            state.changes = changes;
            state.isLoading = false;
          });
        } catch (e) {
          set(state => {
            state.error = e instanceof Error ? e.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      clear: () => {
        debouncedSave.flush();

        set(state => {
          state.profile = null;
          state.template = null;
          state.isLoading = false;
          state.error = null;
        });
      },

      flush: () => debouncedSave.flush(),

      toggleStatus: (collectionId: string, itemId: string) => {
        set(state => {
          if (!state.profile) return;

          if (!state.profile.collections[collectionId]) {
            state.profile.collections[collectionId] = {};
          }

          const current = state.profile.collections[collectionId][itemId] ?? false;
          state.profile.collections[collectionId][itemId] = !current;
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
    };
  })
);

useProfileListStore.subscribe(
  state => state.activeId,
  activeId => {
    if (activeId) {
      useActiveProfileStore.getState().load(activeId);
    } else {
      useActiveProfileStore.getState().clear();
    }
  },
  { fireImmediately: true }
);
