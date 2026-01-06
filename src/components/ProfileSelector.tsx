// components/profile/ProfileSelector.tsx
import { useState, useRef } from 'react';
import { type Profile } from '@/domain/profile';
import { type ProfileIndex, type ProfileSummary } from '@/storage/localStorage';
import { ProfileDropdown } from './ProfileDropdown';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { ProfileDrawer } from './ProfileDrawer';

type ProfileSelectorProps = {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary | null;
  onSelect: (profileId: string) => void;
  onCreate: (name: string, templateId: string, templateLink: string) => void;
  onImport: (profile: Profile) => void;
};

export function ProfileSelector({
  profiles,
  activeProfile,
  onSelect,
  onCreate,
  onImport,
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  const handleSelect = (profileId: string) => {
    onSelect(profileId);
    close();
  };

  const handleCreate = () => {
    const name = prompt('Enter profile name:');
    const templateLink = prompt('Enter template link:');
    if (name && templateLink) {
      onCreate(name, 'template-id', templateLink);
    }
    close();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const profile = JSON.parse(event.target?.result as string);
        onImport(profile);
        close();
      } catch {
        alert('Invalid profile file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const listProps = {
    profiles,
    onSelect: handleSelect,
    onCreate: handleCreate,
    onImport: handleImportClick,
  };

  return (
    <>
      {/* Desktop Dropdown */}
      <ProfileDropdown
        activeProfile={activeProfile}
        isOpen={isOpen}
        onToggle={toggle}
        onClose={close}
        {...listProps}
      />

      {/* Save Button */}
      <button
        onClick={() => {}}
        disabled={!activeProfile?.id}
        className="
                flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2
                text-sm font-medium text-white
                hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50
              "
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </button>

      {/* Mobile Drawer */}
      <ProfileDrawer
        activeProfile={activeProfile}
        isOpen={isOpen}
        onOpen={open}
        onClose={close}
        {...listProps}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
