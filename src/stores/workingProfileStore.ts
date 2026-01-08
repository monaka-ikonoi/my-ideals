// stores/workingProfileStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProfileSchema } from '@/domain/profile';
import { TemplateSchema } from '@/domain/template';
import {
  type WorkingProfile,
  buildWorkingProfile,
  extractProfileFromWorking,
} from '@/domain/working';
import { ProfileStorage } from '@/storage/profileStorage';
import { useProfileListStore } from './profileListStore';
import { debounce } from 'lodash-es';

type WorkingProfileStore = {
  // State
  working: WorkingProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  load: (profileId: string) => Promise<void>;
  clear: () => void;
  flush: () => void;
  toggleStatus: (collectionId: string, itemId: string) => void;
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

      load: async (profileId: string) => {
        debouncedSave.flush();

        set(state => {
          state.working = null;
          state.isLoading = true;
          state.error = null;
        });

        try {
          const profile = ProfileStorage.getProfile(profileId);
          if (!profile) throw new Error('Profile not found');

          const res = await fetch(profile.template.link);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const template = TemplateSchema.parse(await res.json());
          const working = buildWorkingProfile(profile, template);

          set(state => {
            state.working = working;
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
