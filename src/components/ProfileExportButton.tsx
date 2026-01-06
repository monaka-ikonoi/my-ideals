import { ProfileStorage, type ProfileEntry } from '@/storage/localStorage';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { saveAs } from 'file-saver';

type ProfileExportButtonProps = {
  activeProfile: ProfileEntry | null;
};

export function ProfileExportButton({ activeProfile }: ProfileExportButtonProps) {
  const handleExport = () => {
    if (!activeProfile) return;

    const profile = ProfileStorage.getProfile(activeProfile.id);
    if (!profile) {
      console.error(`exportProfile: Profile ${activeProfile.id} not found`);
      return;
    }

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    saveAs(blob, `my-ideals-profile-${profile.name}.json`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!activeProfile}
      className="
                flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2
                text-sm font-medium text-white
                    hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50
                  "
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Save</span>
    </button>
  );
}
