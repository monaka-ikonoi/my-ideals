import { useDialogStore } from '@/stores/dialogStore';
import { ProfileCreateDialog } from './dialogs/ProfileCreateDialog';
import { ProfileImportDialog } from './dialogs/ProfileImportDialog';
import { ProfileTemplateDiffDialog } from './ProfileTemplateDiffDialog';

export function GlobalDialogs() {
  const activeDialog = useDialogStore(state => state.activeDialog);
  const closeDialog = useDialogStore(state => state.closeDialog);

  return (
    <>
      <ProfileCreateDialog isOpen={activeDialog === 'create-profile'} onClose={closeDialog} />
      <ProfileImportDialog isOpen={activeDialog === 'import-profile'} onClose={closeDialog} />
      <ProfileTemplateDiffDialog />
    </>
  );
}
