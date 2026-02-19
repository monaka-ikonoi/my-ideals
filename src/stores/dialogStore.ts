import { create } from 'zustand';

type DialogState =
  | { type: null }
  | { type: 'create-profile' }
  | { type: 'import-profile' }
  | { type: 'delete-profile'; profileId: string; profileName: string }
  | { type: 'rename-profile'; profileId: string; profileName: string }
  | {
      type: 'edit-profile-template-url';
      profileId: string;
      templateId: string;
      currentUrl: string;
    }
  | { type: 'switch-profile-mode'; profileId: string; enableCount: boolean }
  | { type: 'collection-image-preview'; image: Blob; fileName: string }
  | { type: 'about' };

type DialogStore = {
  activeDialog: DialogState;
  closeDialog: () => void;

  openCreateProfile: () => void;
  openImportProfile: () => void;
  openDeleteProfile: (profileId: string, profileName: string) => void;
  openRenameProfile: (profileId: string, profileName: string) => void;
  openEditProfileTemplateUrl: (profileId: string, templateId: string, currentUrl: string) => void;
  openSwitchProfileMode: (profileId: string, enableCount: boolean) => void;
  openCollectionImagePreview: (image: Blob, fileName: string) => void;
  openAbout: () => void;
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
  openEditProfileTemplateUrl: (profileId, templateId, currentUrl) =>
    set({
      activeDialog: {
        type: 'edit-profile-template-url',
        profileId,
        templateId,
        currentUrl,
      },
    }),
  openSwitchProfileMode: (profileId: string, enableCount: boolean) =>
    set({ activeDialog: { type: 'switch-profile-mode', profileId, enableCount } }),
  openCollectionImagePreview: (image, fileName) =>
    set({ activeDialog: { type: 'collection-image-preview', image, fileName } }),
  openAbout: () => set({ activeDialog: { type: 'about' } }),
}));
