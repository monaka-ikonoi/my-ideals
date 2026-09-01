import { createStore, type StoreApi } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash-es';
import {
  buildRecordFields,
  buildRecordFieldViews,
  type Profile,
  type RecordField,
  type RecordMode,
  type RecordValue,
  type RecordFieldView,
} from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import { writeField } from '@/utils/recordUtils';
import { syncProfileWithTemplate } from '@/services/syncProfile';
import { applyRecordMode, type RecordFieldWithOption } from '@/services/recordMode';

export type LoadedProfile = {
  profile: Profile;
  template: Template | null;
};

export type ProfileState = LoadedProfile & {
  fields: RecordField[];
  fieldViews: RecordFieldView[];
  flush: () => Promise<void>;
  syncWithTemplate: (cleanup: boolean) => Promise<void>;
  setFieldValue: (
    collectionId: string,
    itemId: string,
    fieldId: string,
    value: RecordValue
  ) => void;
  toggleMember: (member: string) => void;
  updateName: (name: string) => void;
  updateTemplateInfo: (url: string, templateId?: string) => void;
  setMode: (mode: RecordMode, customFields?: RecordFieldWithOption[]) => void;
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
        fields: buildRecordFields(loaded.profile),
        fieldViews: buildRecordFieldViews(loaded.profile),

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

        setFieldValue: (
          collectionId: string,
          itemId: string,
          fieldId: string,
          value: RecordValue
        ) => {
          set(state => {
            const field = state.fields.find(f => f.id === fieldId);
            if (!field) return;
            if (field.type === 'boolean' && typeof value !== 'boolean') return;
            if (field.type === 'number' && !Number.isInteger(value)) return;

            if (!state.profile.collections[collectionId]) {
              state.profile.collections[collectionId] = {};
            }

            const record = state.profile.collections[collectionId][itemId];
            state.profile.collections[collectionId][itemId] = writeField(record, field, value);
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

        setMode: (mode: RecordMode, customFields?: RecordFieldWithOption[]) => {
          set(state => {
            if (state.profile.mode === mode && mode !== 'custom') return;

            debugLog.perf.time(`Apply record mode ${mode}`);
            applyRecordMode(state.profile, mode, customFields);
            state.fields = buildRecordFields(state.profile);
            state.fieldViews = buildRecordFieldViews(state.profile);
            touch(state.profile);
            debugLog.perf.timeEnd(`Apply record mode ${mode}`);
            debugLog.store.log(`Profile ${state.profile.id} record mode set to ${mode}`);
          });
          debouncedSave();
        },
      };
    })
  );
}
