import { DEV_MODE } from '@/utils/appInfo';

export function DebugSettings({ onSelect }: { onSelect?: () => void }) {
  if (!DEV_MODE) return null;

  return (
    <>
      <div className="border-t border-gray-200" />
      <div className="py-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Debug</div>

        <button
          onClick={() => {
            localStorage.removeItem('my-ideals:settings');
            sessionStorage.clear();
            onSelect?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          Reset settings
        </button>
      </div>
    </>
  );
}
