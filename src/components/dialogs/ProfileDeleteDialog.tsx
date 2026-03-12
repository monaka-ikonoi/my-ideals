import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useProfileListStore } from '@/stores/profileListStore';

type ProfileDeleteDialogProps = {
  onClose: () => void;
  profileId: string;
  profileName: string;
};

export function ProfileDeleteDialog({ onClose, profileId, profileName }: ProfileDeleteDialogProps) {
  const { t } = useTranslation();

  const handleConfirmDelete = (value: string) => {
    if (value === 'delete' && profileId) {
      useProfileListStore.getState().deleteProfile(profileId);
      toast.success(t('toast.profile-deleted', { name: profileName }));
    }
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.profile-delete.title')}
      options={[{ label: t('common.delete'), value: 'delete', variant: 'danger' }]}
      onSelect={handleConfirmDelete}
      onCancel={onClose}
    >
      <p>
        <Trans
          i18nKey="dialog.profile-delete.content-confim"
          values={{ name: profileName }}
          components={{ strong: <strong /> }}
        />
      </p>
      <p>{t('dialog.profile-delete.content-warn')}</p>
    </ConfirmDialog>
  );
}
