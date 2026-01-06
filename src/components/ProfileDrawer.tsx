import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ProfileList, type ProfileListProps } from './ProfileList';

type ProfileDrawerProps = ProfileListProps & {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function ProfileDrawer({
  isOpen,
  onOpen,
  onClose,
  activeProfile,
  ...listProps
}: ProfileDrawerProps) {
  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={onOpen}
        className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 focus:ring-2
          focus:ring-blue-500 focus:outline-none lg:hidden"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Menu</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Current Profile */}
            {activeProfile && (
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Current Profile</div>
                <div className="mt-1 truncate font-medium text-gray-900">{activeProfile.name}</div>
              </div>
            )}

            {/* List */}
            <div className="overflow-y-auto">
              <ProfileList activeProfile={activeProfile} {...listProps} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
