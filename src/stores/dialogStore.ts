import { create } from 'zustand';

type DialogType = 'create-profile' | 'import-profile' | null;

type DialogStore = {
  activeDialog: DialogType;
  openCreateProfile: () => void;
  openImportProfile: () => void;
  closeDialog: () => void;
};

export const useDialogStore = create<DialogStore>(set => ({
  activeDialog: null,
  openCreateProfile: () => set({ activeDialog: 'create-profile' }),
  openImportProfile: () => set({ activeDialog: 'import-profile' }),
  closeDialog: () => set({ activeDialog: null }),
}));
