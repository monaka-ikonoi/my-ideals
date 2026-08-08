import { useDialogStore } from '@/stores/dialogStore';
import { DisclaimerDialog } from './dialogs/DisclaimerDialog';
import { ProfileCreateDialog } from './dialogs/ProfileCreateDialog';
import { ProfileImportDialog } from './dialogs/ProfileImportDialog';
import { ProfileDeleteDialog } from './dialogs/ProfileDeleteDialog';
import { ProfileEditTemplateUrlDialog } from './dialogs/ProfileEditTemplateUrl';
import { AboutDialog } from './dialogs/AboutDialog';
import { PwaUpdateDialog } from './dialogs/PwaUpdateDialog';
import { IosInstallGuideDialog } from './dialogs/IosInstallGuideDialog';

export function GlobalDialogs() {
  const activeDialog = useDialogStore(state => state.activeDialog);
  const closeDialog = useDialogStore(state => state.closeDialog);

  return (
    <>
      <DisclaimerDialog />
      <PwaUpdateDialog />

      {activeDialog.type === 'create-profile' && <ProfileCreateDialog onClose={closeDialog} />}
      {activeDialog.type === 'import-profile' && <ProfileImportDialog onClose={closeDialog} />}
      {activeDialog.type === 'delete-profile' && (
        <ProfileDeleteDialog
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
      {activeDialog.type === 'about' && <AboutDialog onClose={closeDialog} />}
      {activeDialog.type === 'install-app-ios' && <IosInstallGuideDialog onClose={closeDialog} />}
    </>
  );
}
