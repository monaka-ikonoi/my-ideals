import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useProfileListStore } from '@/stores/profileListStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { toast } from 'sonner';

type ProfileDuplicateDialogProps = {
  onClose: () => void;
};

export function ProfileDuplicateDialog({ onClose }: ProfileDuplicateDialogProps) {
  const profile = useActiveProfileStore.getState().profile!;
  const { t } = useTranslation();

  const [newName, setNewName] = useState(
    t('dialog.profile-duplicate.name-default', { name: profile.name })
  );

  const handleDuplicate = () => {
    const trimmedName = newName.trim();
    if (trimmedName) {
      const duplicated = structuredClone(profile);
      duplicated.name = trimmedName;
      useProfileListStore.getState().importProfile(duplicated, false);
      toast.success(t('toast.profile-duplicate.success', { name: trimmedName }));
    }
    onClose();
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
      </div>
    </ConfirmDialog>
  );
}
