import { useDialogStore } from '@/stores/dialogStore';
import { DisclaimerDialog } from './dialogs/DisclaimerDialog';
import { ProfileTemplateDiffDialog } from './dialogs/ProfileTemplateDiffDialog';
import { ProfileCreateDialog } from './dialogs/ProfileCreateDialog';
import { ProfileImportDialog } from './dialogs/ProfileImportDialog';
import { ProfileDeleteDialog } from './dialogs/ProfileDeleteDialog';
import { ProfileRenameDialog } from './dialogs/ProfileRenameDialog';
import { ProfileEditTemplateUrlDialog } from './dialogs/ProfileEditTemplateUrl';
import { ProfileSwitchModeDialog } from './dialogs/ProfileSwitchModeDialog';
import { AboutDialog } from './dialogs/AboutDialog';
import { CollectionEditModal } from './dialogs/CollectionEditModal';
import { ProfileDuplicateDialog } from './dialogs/ProfileDuplicateDialog';
import { ImageGenerateModal } from './dialogs/ImageGenerateModal';

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
      {activeDialog.type === 'duplicate-profile' && (
        <ProfileDuplicateDialog onClose={closeDialog} />
      )}
      {activeDialog.type === 'edit-profile-template-url' && (
        <ProfileEditTemplateUrlDialog
          profileId={activeDialog.profileId}
          templateId={activeDialog.templateId}
          currentUrl={activeDialog.currentUrl}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'switch-profile-mode' && (
        <ProfileSwitchModeDialog
          profileId={activeDialog.profileId}
          enableCount={activeDialog.enableCount}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'about' && <AboutDialog onClose={closeDialog} />}

      {activeDialog.type === 'edit-collection' && (
        <CollectionEditModal collectionId={activeDialog.collectionId} onClose={closeDialog} />
      )}
      {activeDialog.type === 'generate-image' && (
        <ImageGenerateModal
          collections={activeDialog.collections}
          preSelectedId={activeDialog.preSelectedId}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
