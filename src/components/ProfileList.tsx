import { type ProfileSummary } from '@/storage/localStorage';
import { ArrowUpTrayIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/solid';

export type ProfileListProps = {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary | null;
  onSelect: (profileId: string) => void;
  onCreate: () => void;
  onImport: () => void;
};

export function ProfileList({
  profiles,
  activeProfile,
  onSelect,
  onCreate,
  onImport,
}: ProfileListProps) {
  return (
    <>
      {profiles.length > 0 && (
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">Profiles</div>
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className={`
                flex w-full items-center gap-2 px-3 py-2 text-left text-sm
                ${
                  profile.id === activeProfile?.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {profile.id === activeProfile?.id ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="w-4" />
              )}
              <span className="truncate">{profile.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <button
          onClick={onCreate}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <PlusIcon className="h-4 w-4" />
          New Profile
        </button>
        <button
          onClick={onImport}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          Import Profile
        </button>
      </div>
    </>
  );
}
