import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { ProfileFlags } from '@/domain/profile';

type ProfileSwitchModeDialogProps = {
  onClose: () => void;
  profileId: string;
  enableCount: boolean;
};

export function ProfileSwitchModeDialog({
  onClose,
  profileId,
  enableCount,
}: ProfileSwitchModeDialogProps) {
  const { t } = useTranslation();

  const handleConfirmSwitch = (value: string) => {
    if (value === 'switch' && profileId) {
      useActiveProfileStore.getState().toogleFlag(ProfileFlags.ENABLE_COUNT, enableCount);
    }
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.profile-switch-mode.title')}
      options={[
        {
          label: t('dialog.profile-switch-mode.confirm'),
          value: 'switch',
          variant: enableCount ? 'primary' : 'danger',
        },
      ]}
      onSelect={handleConfirmSwitch}
      onCancel={onClose}
    >
      <p>
        {enableCount
          ? t('dialog.profile-switch-mode.to-count')
          : t('dialog.profile-switch-mode.to-standard')}
      </p>
      {!enableCount && (
        <p className="mt-2 text-red-600">{t('dialog.profile-switch-mode.to-standard-warn')}</p>
      )}
    </ConfirmDialog>
  );
}
