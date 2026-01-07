import { useProfileListStore } from '@/stores/profileListStore';
import { ArrowUpTrayIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/solid';

export type ProfileListProps = {
  onCreate: () => void;
  onImport: () => void;
};

export function ProfileList({ onCreate, onImport }: ProfileListProps) {
  const profiles = useProfileListStore(state => state.profiles);
  const activeProfileId = useProfileListStore(state => state.activeId);

  const selectProfile = useProfileListStore(state => state.setActiveProfile);

  return (
    <>
      {profiles.length > 0 && (
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Profiles</div>
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile.id)}
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
                <div className="truncate text-xs text-gray-400">
                  ID: <span className="font-mono">{profile.id}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <button
          onClick={onCreate}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <PlusIcon className="h-4 w-4" />
          New Profile
        </button>
        <button
          onClick={onImport}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          Import Profile
        </button>
      </div>
    </>
  );
}
