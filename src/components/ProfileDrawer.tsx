import { useTranslation } from 'react-i18next';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ProfileList } from './ProfileList';
import { useProfileListStore } from '@/stores/profileListStore';
import { SettingsPanel } from './SettingsPanel';

type ProfileDrawerProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function ProfileDrawer({ isOpen, onOpen, onClose }: ProfileDrawerProps) {
  const { t } = useTranslation();

  const activeProfile = useProfileListStore(
    state => state.profiles.find(p => p.id === state.activeId) ?? null
  );

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
              <h2 className="font-semibold text-gray-900">{t('common.menu')}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Current Profile */}
            {activeProfile && (
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  {t('profile.current')}
                </div>
                <div className="mt-1 truncate font-medium text-gray-900">{activeProfile.name}</div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile List */}
              <ProfileList />

              {/* Settings */}
              <div className="border-t border-gray-200">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
