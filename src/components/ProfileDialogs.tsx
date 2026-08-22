import { useDialogStore } from '@/stores/dialogStore';
import { ProfileTemplateDiffDialog } from './dialogs/ProfileTemplateDiffDialog';
import { ProfileRenameDialog } from './dialogs/ProfileRenameDialog';
import { ProfileDuplicateDialog } from './dialogs/ProfileDuplicateDialog';
import { ProfileModeModal } from './dialogs/ProfileModeModal';
import { CollectionFilterDialog } from './dialogs/CollectionFilterDialog';
import { CollectionEditModal } from './dialogs/CollectionEditModal';
import { ImageGenerateModal } from './dialogs/ImageGenerateModal';

export function ProfileDialogs() {
  const activeDialog = useDialogStore(state => state.activeDialog);
  const closeDialog = useDialogStore(state => state.closeDialog);

  return (
    <>
      <ProfileTemplateDiffDialog />
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
      {activeDialog.type === 'edit-collection' && (
        <CollectionEditModal collectionId={activeDialog.collectionId} onClose={closeDialog} />
      )}
      {activeDialog.type === 'edit-profile-mode' && <ProfileModeModal onClose={closeDialog} />}
      {activeDialog.type === 'edit-collection-filter' && (
        <CollectionFilterDialog onClose={closeDialog} />
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
