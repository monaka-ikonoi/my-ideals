import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useProfileListStore } from '@/stores/profileListStore';
import { getActiveProfile } from '@/stores/activeProfileStore';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';

type ProfileDuplicateDialogProps = {
  onClose: () => void;
};

export function ProfileDuplicateDialog({ onClose }: ProfileDuplicateDialogProps) {
  const { t } = useTranslation();
  const { importProfile, setActiveProfile } = useProfileListStore(
    useShallow(state => ({
      importProfile: state.importProfile,
      setActiveProfile: state.setActiveProfile,
    }))
  );

  const profile = getActiveProfile().profile;

  const [newName, setNewName] = useState(
    t('dialog.profile-duplicate.name-default', { name: profile.name })
  );
  const [switchToDuplicated, setSwitchToDuplicated] = useState(true);

  const handleDuplicate = async () => {
    const trimmedName = newName.trim();
    try {
      if (trimmedName) {
        const duplicated = structuredClone(profile);
        duplicated.name = trimmedName;
        const duplicatedProfileId = await importProfile(duplicated, false);
        if (switchToDuplicated) setActiveProfile(duplicatedProfileId);
        toast.success(t('toast.profile-duplicated', { name: trimmedName }));
      }
      onClose();
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.profile-duplicate.title')}
      options={[{ label: t('common.ok'), value: 'confirm', variant: 'primary' }]}
      onSelect={handleDuplicate}
      onCancel={onClose}
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('dialog.profile-duplicate.name-label')}
        </label>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleDuplicate();
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
          autoFocus
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
          <input
            type="checkbox"
            checked={switchToDuplicated}
            onChange={e => setSwitchToDuplicated(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
          />
          {t('dialog.profile-duplicate.switch-after')}
        </label>
      </div>
    </ConfirmDialog>
  );
}
