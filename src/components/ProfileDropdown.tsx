import { useProfileListStore } from '@/stores/profileListStore';
import { ProfileList } from './ProfileList';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

type ProfileDropdownProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function ProfileDropdown({ isOpen, onToggle, onClose }: ProfileDropdownProps) {
  const activeProfile = useProfileListStore(
    state => state.profiles.find(p => p.id === state.activeId) ?? null
  );

  return (
    <div className="relative hidden lg:block">
      {/* Trigger Button */}
      <button
        onClick={onToggle}
        className="flex w-72 items-center justify-between gap-2 rounded-lg border border-gray-300
          bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2
          focus:ring-blue-500 focus:outline-none"
      >
        <span className="truncate">{activeProfile?.name ?? 'Select Profile'}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={onClose} />
          <div
            className="absolute right-0 mt-2 w-72 origin-top-right rounded-lg border border-gray-200
              bg-white shadow-lg"
          >
            <ProfileList onSelect={onClose} />
          </div>
        </>
      )}
    </div>
  );
}
