import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useProfileListStore, type ProfileListEntry } from '@/stores/profileListStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArrowUpTrayIcon, CheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ProfileImportButton } from './ProfileImportButton';
import { ProfileCreateButton } from './ProfileCreateButton';

type ProfileListProps = {
  onSelect?: () => void;
};

export function ProfileList({ onSelect }: ProfileListProps) {
  const { t } = useTranslation();
  const profiles = useProfileListStore(state => state.profiles);
  const activeProfileId = useProfileListStore(state => state.activeId);

  const [deleteTarget, setDeleteTarget] = useState<ProfileListEntry | null>(null);

  const handleSelect = (id: string) => {
    useProfileListStore.getState().setActiveProfile(id);
    onSelect?.();
  };

  const handleDeleteClick = (e: React.MouseEvent, profile: ProfileListEntry) => {
    e.stopPropagation();
    setDeleteTarget(profile);
  };

  const handleConfirmDelete = (value: string) => {
    if (value === 'delete' && deleteTarget) {
      useProfileListStore.getState().deleteProfile(deleteTarget.id);
      // TODO: toast.success(`Profile "${deleteTarget.name}" deleted`);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      {profiles.length > 0 && (
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Profiles</div>
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                profile.id === activeProfileId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              } `}
            >
              {profile.id === activeProfileId ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="w-4" />
              )}

              <div className="min-w-0 flex-1">
                <span className="truncate">{profile.name}</span>
                <div className="truncate font-mono text-xs text-gray-400">ID: {profile.id}</div>
              </div>

              {/* Delete button */}
              <div
                onClick={e => handleDeleteClick(e, profile)}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <ProfileCreateButton
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <PlusIcon className="h-4 w-4" />
          {t('profile.create')}
        </ProfileCreateButton>
        <ProfileImportButton
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          {t('profile.import')}
        </ProfileImportButton>

        {/* Delete Confirm Dialog */}
        {createPortal(
          <ConfirmDialog
            isOpen={deleteTarget !== null}
            title={t('profile.delete-dialog.title')}
            message={
              <p>
                <Trans
                  i18nKey="profile.delete-dialog.content-confim"
                  values={{ name: deleteTarget?.name }}
                  components={{ strong: <strong /> }}
                />
                <br />
                {t('profile.delete-dialog.content-warn')}
              </p>
            }
            options={[{ label: t('common.delete'), value: 'delete', variant: 'danger' }]}
            onSelect={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />,
          document.body
        )}
      </div>
    </>
  );
}
