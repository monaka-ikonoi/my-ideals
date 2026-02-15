import { useDialogStore } from '@/stores/dialogStore';
import { DisclaimerDialog } from './dialogs/DisclaimerDialog';
import { ProfileTemplateDiffDialog } from './dialogs/ProfileTemplateDiffDialog';
import { ProfileCreateDialog } from './dialogs/ProfileCreateDialog';
import { ProfileImportDialog } from './dialogs/ProfileImportDialog';
import { ProfileDeleteDialog } from './dialogs/ProfileDeleteDialog';
import { ProfileRenameDialog } from './dialogs/ProfileRenameDialog';
import { ProfileEditTemplateUrlDialog } from './dialogs/ProfileEditTemplateUrl';
import { CollectionImagePreviewDialog } from './dialogs/CollectionImagePreviewDialog';
import { AboutDialog } from './dialogs/AboutDialog';

export function GlobalDialogs() {
  const activeDialog = useDialogStore(state => state.activeDialog);
  const closeDialog = useDialogStore(state => state.closeDialog);

  return (
    <>
      <DisclaimerDialog />
      <ProfileTemplateDiffDialog />

      {activeDialog.type === 'create-profile' && <ProfileCreateDialog onClose={closeDialog} />}
      {activeDialog.type === 'import-profile' && <ProfileImportDialog onClose={closeDialog} />}
      {activeDialog.type === 'delete-profile' && (
        <ProfileDeleteDialog
          profileId={activeDialog.profileId}
          profileName={activeDialog.profileName}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'rename-profile' && (
        <ProfileRenameDialog
          profileId={activeDialog.profileId}
          profileName={activeDialog.profileName}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'edit-profile-template-url' && (
        <ProfileEditTemplateUrlDialog
          profileId={activeDialog.profileId}
          templateId={activeDialog.templateId}
          currentUrl={activeDialog.currentUrl}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'collection-image-preview' && (
        <CollectionImagePreviewDialog
          imageUrl={activeDialog.imageUrl}
          fileName={activeDialog.fileName}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'about' && <AboutDialog onClose={closeDialog} />}
    </>
  );
}
