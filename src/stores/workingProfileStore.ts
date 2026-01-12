import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import { TemplateSchema } from '@/domain/template';
import {
  type WorkingProfile,
  buildWorkingProfile,
  extractProfileFromWorking,
} from '@/domain/working';
import { ProfileStorage } from '@/storage/profileStorage';
import { useProfileListStore } from './profileListStore';
import { type ProfileTemplateDiff, diffProfileTemplate } from '@/utils/diffProfileTemplate';

type WorkingProfileStore = {
  // State
  working: WorkingProfile | null;
  isLoading: boolean;
  error: string | null;
  changes: ProfileTemplateDiff | null;

  // Actions
  load: (profileId: string) => Promise<void>;
  clear: () => void;
  flush: () => void;
  toggleStatus: (collectionId: string, itemId: string) => void;
  updateName: (name: string) => void;
};

export const useWorkingProfileStore = create<WorkingProfileStore>()(
  immer((set, get) => {
    const debouncedSave = debounce(() => {
      const { working } = get();
      if (!working) return;

      const profile = extractProfileFromWorking(working);
      ProfileStorage.setProfile(profile);
      console.log(`Profile ${profile.id} saved`);
    }, 500);

    return {
      working: null,
      isLoading: false,
      error: null,
      changes: null,

      load: async (profileId: string) => {
        debouncedSave.flush();

        set(state => {
          state.working = null;
          state.isLoading = true;
          state.error = null;
          state.changes = null;
        });

        try {
          const profile = ProfileStorage.getProfile(profileId);
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
          if (profile.template.revision !== 0 && profile.template.revision !== template.revision) {
            changes = diffProfileTemplate(profile, template);
          }

          const working = buildWorkingProfile(profile, template);
          // Save if there is an update
          if (working.profile.template.revision !== profile.template.revision) {
            console.log(`Profile updated to template rev ${working.profile.template.revision}`);
            ProfileStorage.setProfile(extractProfileFromWorking(working));
          }

          set(state => {
            state.working = working;
            state.isLoading = false;
            state.changes = changes;
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
          state.working = null;
          state.isLoading = false;
          state.error = null;
        });
      },

      flush: () => debouncedSave.flush(),

      toggleStatus: (collectionId: string, itemId: string) => {
        set(state => {
          if (!state.working) return;

          const collection = state.working.collections.find(c => c.id === collectionId);
          if (!collection) return;

          const item = collection.items.find(i => i.id === itemId);
          if (!item) return;

          item.status = !item.status;
        });

        debouncedSave();
      },

      updateName: (name: string) => {
        set(state => {
          if (state.working) {
            state.working.profile.name = name;
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
      useWorkingProfileStore.getState().load(activeId);
    } else {
      useWorkingProfileStore.getState().clear();
    }
  },
  { fireImmediately: true }
);
