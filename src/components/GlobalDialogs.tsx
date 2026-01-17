import { useDialogStore } from '@/stores/dialogStore';
import { DisclaimerDialog } from './dialogs/DisclaimerDialog';
import { ProfileCreateDialog } from './dialogs/ProfileCreateDialog';
import { ProfileImportDialog } from './dialogs/ProfileImportDialog';
import { ProfileDeleteDialog } from './dialogs/ProfileDeleteDialog';
import { ProfileTemplateDiffDialog } from './ProfileTemplateDiffDialog';

export function GlobalDialogs() {
  const activeDialog = useDialogStore(state => state.activeDialog);
  const closeDialog = useDialogStore(state => state.closeDialog);

  const profileDeleteDialogProps =
    activeDialog.type === 'delete-profile'
      ? { isOpen: true, profileId: activeDialog.profileId, profileName: activeDialog.profileName }
      : { isOpen: false, profileId: '', profileName: '' };

  return (
    <>
      <DisclaimerDialog />
      <ProfileCreateDialog isOpen={activeDialog.type === 'create-profile'} onClose={closeDialog} />
      <ProfileImportDialog isOpen={activeDialog.type === 'import-profile'} onClose={closeDialog} />
      <ProfileDeleteDialog {...profileDeleteDialogProps} onClose={closeDialog} />
      <ProfileTemplateDiffDialog />
    </>
  );
}
