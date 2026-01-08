import { extractProfileFromWorking } from '@/domain/working';
import { useWorkingProfileStore } from '@/stores/workingProfileStore';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

export function ProfileExportButton() {
  const working = useWorkingProfileStore(state => state.working);

  const handleExport = () => {
    if (!working) return;

    const profile = extractProfileFromWorking(working);
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const filename = `my-ideals-profile-${profile.name}.json`;
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!working}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium
        text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Save</span>
    </button>
  );
}
