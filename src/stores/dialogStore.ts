import type { TemplateCollection } from '@/domain/template';
import { create } from 'zustand';

type DialogState =
  | { type: null }
  | { type: 'create-profile' }
  | { type: 'import-profile' }
  | { type: 'delete-profile'; profileId: string; profileName: string }
  | { type: 'rename-profile'; profileId: string; profileName: string }
  | { type: 'duplicate-profile' }
  | {
      type: 'edit-profile-template-url';
      profileId: string;
      templateId: string;
      currentUrl: string;
    }
  | { type: 'edit-record-fields' }
  | { type: 'edit-collection-filter' }
  | { type: 'collection-image-preview'; image: Blob; fileName: string }
  | { type: 'about' }
  | { type: 'install-app-ios' }
  | { type: 'edit-collection'; collectionId: string }
  | {
      type: 'generate-image';
      collections: TemplateCollection[];
      preSelectedId?: string;
    };

type DialogStore = {
  activeDialog: DialogState;
  closeDialog: () => void;

  openCreateProfile: () => void;
  openImportProfile: () => void;
  openDeleteProfile: (profileId: string, profileName: string) => void;
  openRenameProfile: (profileId: string, profileName: string) => void;
  openDuplicateProfile: () => void;
  openEditProfileTemplateUrl: (profileId: string, templateId: string, currentUrl: string) => void;
  openEditRecordFields: () => void;
  openEditCollectionFilter: () => void;
  openAbout: () => void;
  openInstallAppIos: () => void;

  openEditCollection: (collectionId: string) => void;
  openGenerateImage: (collections: TemplateCollection[], preSelectedId?: string) => void;
};

export const useDialogStore = create<DialogStore>(set => ({
  activeDialog: { type: null },
  closeDialog: () => set({ activeDialog: { type: null } }),

  openCreateProfile: () => set({ activeDialog: { type: 'create-profile' } }),
  openImportProfile: () => set({ activeDialog: { type: 'import-profile' } }),
  openDeleteProfile: (profileId, profileName) =>
    set({ activeDialog: { type: 'delete-profile', profileId, profileName } }),
  openRenameProfile: (profileId, profileName) =>
    set({ activeDialog: { type: 'rename-profile', profileId, profileName } }),
  openDuplicateProfile: () => set({ activeDialog: { type: 'duplicate-profile' } }),
  openEditProfileTemplateUrl: (profileId, templateId, currentUrl) =>
    set({
      activeDialog: {
        type: 'edit-profile-template-url',
        profileId,
        templateId,
        currentUrl,
      },
    }),
  openEditRecordFields: () => set({ activeDialog: { type: 'edit-record-fields' } }),
  openEditCollectionFilter: () => set({ activeDialog: { type: 'edit-collection-filter' } }),
  openAbout: () => set({ activeDialog: { type: 'about' } }),
  openInstallAppIos: () => set({ activeDialog: { type: 'install-app-ios' } }),

  openEditCollection: collectionId =>
    set({ activeDialog: { type: 'edit-collection', collectionId } }),
  openGenerateImage: (collections, preSelectedId) =>
    set({ activeDialog: { type: 'generate-image', collections, preSelectedId } }),
}));
