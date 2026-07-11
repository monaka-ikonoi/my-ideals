import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileDropdown } from './ProfileDropdown';
import { ProfileDrawer } from './ProfileDrawer';
import { SettingsDropdown } from './SettingsDropdown';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useProfileExporter } from '@/hooks/useProfileExporter';

export function ProfileSelector() {
  const { t } = useTranslation();
  const { canExport, exportProfile } = useProfileExporter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeProfile = () => setIsProfileOpen(false);
  const toggleProfile = () => {
    closeSettings();
    setIsProfileOpen(prev => !prev);
  };

  const closeSettings = () => setIsSettingsOpen(false);
  const toggleSettings = () => {
    closeProfile();
    setIsSettingsOpen(prev => !prev);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      {/* Desktop: Profile Dropdown */}
      <ProfileDropdown isOpen={isProfileOpen} onToggle={toggleProfile} onClose={closeProfile} />

      {/* Save Button */}
      <button
        type="button"
        onClick={exportProfile}
        disabled={!canExport}
        className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 p-2 text-sm
          font-medium text-white hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed
          disabled:opacity-50 sm:px-3 sm:py-2"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{t('profile.export')}</span>
      </button>

      {/* Desktop: Settings Dropdown */}
      <SettingsDropdown isOpen={isSettingsOpen} onToggle={toggleSettings} onClose={closeSettings} />

      {/* Mobile: Drawer (Profile + Settings) */}
      <ProfileDrawer isOpen={isDrawerOpen} onOpen={openDrawer} onClose={closeDrawer} />
    </>
  );
}
