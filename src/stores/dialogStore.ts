import { create } from 'zustand';

type DialogState =
  | { type: null }
  | { type: 'create-profile' }
  | { type: 'import-profile' }
  | { type: 'delete-profile'; profileId: string; profileName: string }
  | { type: 'rename-profile'; profileId: string; profileName: string }
  | { type: 'about' };

type DialogStore = {
  activeDialog: DialogState;
  closeDialog: () => void;

  openCreateProfile: () => void;
  openImportProfile: () => void;
  openDeleteProfile: (profileId: string, profileName: string) => void;
  openRenameProfile: (profileId: string, profileName: string) => void;
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
  openAbout: () => set({ activeDialog: { type: 'about' } }),
}));
