import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useProfileListStore } from '@/stores/profileListStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type ProfileRenameDialogProps = {
  onClose: () => void;
  profileId: string;
  profileName: string;
};

export function ProfileRenameDialog({ onClose, profileId, profileName }: ProfileRenameDialogProps) {
  const { t } = useTranslation();

  const [newName, setNewName] = useState(profileName);

  const handleSaveName = () => {
    const name = newName.trim();
    if (profileId && name && name !== profileName) {
      useActiveProfileStore.getState().updateName(name);
      useProfileListStore.getState().renameProfile(profileId, name);
    }
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.profile-rename.title')}
      options={[{ label: t('common.save'), value: 'save', variant: 'primary' }]}
      onSelect={handleSaveName}
      onCancel={onClose}
    >
      <input
        type="text"
        value={newName}
        onChange={e => setNewName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveName();
          }
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        autoFocus
      />
    </ConfirmDialog>
  );
}
