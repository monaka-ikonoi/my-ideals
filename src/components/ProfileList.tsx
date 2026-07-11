import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileListStore, type ProfileListEntry } from '@/stores/profileListStore';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsUpDownIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { useDialogStore } from '@/stores/dialogStore';
import { useProfileExporter } from '@/hooks/useProfileExporter';

type ProfileListProps = {
  maxHeight?: string;
  onSelect?: () => void;
};

export function ProfileList({ maxHeight, onSelect }: ProfileListProps) {
  const { t } = useTranslation();

  const profiles = useProfileListStore(state => state.profiles);
  const activeProfileId = useProfileListStore(state => state.activeId);
  const { canExport, exportProfileBundle } = useProfileExporter();

  const [isReordering, setIsReordering] = useState(false);

  const handleSelect = (id: string) => {
    // Exit reordering mode on the next click to prevent accidental profile switches
    if (isReordering) {
      setIsReordering(false);
      return;
    }
    useProfileListStore.getState().setActiveProfile(id);
    onSelect?.();
  };

  const handleDeleteClick = (e: React.MouseEvent, profile: ProfileListEntry) => {
    e.stopPropagation();
    useDialogStore.getState().openDeleteProfile(profile.id, profile.name);
    onSelect?.();
  };

  const handleReorderClick = (e: React.MouseEvent, id: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    useProfileListStore.getState().reorderProfile(id, direction);
  };

  return (
    <>
      {profiles.length > 0 && (
        <div className="py-1">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('profile.list')}
            </span>
            <button
              onClick={() => setIsReordering(r => !r)}
              title={t('profile.reorder')}
              className={`rounded p-1 text-xs ${
                isReordering
                  ? 'bg-blue-100 text-blue-600'
                  : `text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed
                    disabled:opacity-30 disabled:hover:bg-transparent`
              }`}
              disabled={profiles.length < 2}
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
            </button>
          </div>
          <div
            className={maxHeight ? 'overflow-y-auto' : ''}
            style={maxHeight ? { maxHeight } : undefined}
          >
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
                  <div className="truncate">{profile.name}</div>
                  <div className="truncate font-mono text-xs text-gray-400">ID: {profile.id}</div>
                </div>

                {/* Delete / Reorder buttons */}
                {isReordering ? (
                  <div className="-my-2 flex w-6 shrink-0 flex-col self-stretch">
                    <button
                      onClick={e => handleReorderClick(e, profile.id, 'up')}
                      disabled={profiles.indexOf(profile) === 0}
                      className="flex flex-1 items-center justify-center rounded text-gray-400
                        hover:bg-blue-100 hover:text-blue-600 disabled:cursor-not-allowed
                        disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={e => handleReorderClick(e, profile.id, 'down')}
                      disabled={profiles.indexOf(profile) === profiles.length - 1}
                      className="flex flex-1 items-center justify-center rounded text-gray-400
                        hover:bg-blue-100 hover:text-blue-600 disabled:cursor-not-allowed
                        disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={e => handleDeleteClick(e, profile)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-100
                      hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <button
          onClick={() => {
            useDialogStore.getState().openCreateProfile();
            onSelect?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <PlusIcon className="h-4 w-4" />
          {t('profile.create')}
        </button>
        <button
          onClick={() => {
            useDialogStore.getState().openImportProfile();
            onSelect?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          {t('profile.import')}
        </button>
        {canExport && (
          <button
            onClick={() => {
              exportProfileBundle();
              onSelect?.();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
              hover:bg-gray-100"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('profile.export-all')}
          </button>
        )}
      </div>
    </>
  );
}
