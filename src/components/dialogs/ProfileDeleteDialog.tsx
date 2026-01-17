import { Trans, useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useProfileListStore } from '@/stores/profileListStore';

type ProfileDeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
};

export function ProfileDeleteDialog({
  isOpen,
  onClose,
  profileId,
  profileName,
}: ProfileDeleteDialogProps) {
  const { t } = useTranslation();

  const handleConfirmDelete = (value: string) => {
    if (value === 'delete' && profileId) {
      useProfileListStore.getState().deleteProfile(profileId);
      // TODO: toast.success(`Profile "${deleteTarget.name}" deleted`);
    }
    onClose();
  };

  if (!isOpen) return;
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t('dialog.profile-delete.title')}
      message={
        <p>
          <Trans
            i18nKey="dialog.profile-delete.content-confim"
            values={{ name: profileName }}
            components={{ strong: <strong /> }}
          />
          <br />
          {t('dialog.profile-delete.content-warn')}
        </p>
      }
      options={[{ label: t('common.delete'), value: 'delete', variant: 'danger' }]}
      onSelect={handleConfirmDelete}
      onCancel={onClose}
    />
  );
}
