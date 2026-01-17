import { create } from 'zustand';

type DialogState =
  | { type: null }
  | { type: 'create-profile' }
  | { type: 'import-profile' }
  | { type: 'delete-profile'; profileId: string; profileName: string };

type DialogStore = {
  activeDialog: DialogState;
  openCreateProfile: () => void;
  openImportProfile: () => void;
  openDeleteProfile: (profileId: string, profileName: string) => void;
  closeDialog: () => void;
};

export const useDialogStore = create<DialogStore>(set => ({
  activeDialog: { type: null },

  openCreateProfile: () => set({ activeDialog: { type: 'create-profile' } }),
  openImportProfile: () => set({ activeDialog: { type: 'import-profile' } }),
  openDeleteProfile: (profileId, profileName) =>
    set({ activeDialog: { type: 'delete-profile', profileId, profileName } }),
  closeDialog: () => set({ activeDialog: { type: null } }),
}));
