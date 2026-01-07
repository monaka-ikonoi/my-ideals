import { useState, useRef } from 'react';
import { ZodError } from 'zod';
import { type Profile, ProfileSchema } from '@/domain/profile';
import { ProfileDropdown } from './ProfileDropdown';
import { ProfileDrawer } from './ProfileDrawer';
import { ProfileExportButton } from './ProfileExportButton';
import { ImportConflictDialog, type ImportConflictAction } from './ProfileImportConflictDialog';
import { ErrorDialog } from './ui/ErrorDialog';
import { useProfileListStore } from '@/stores/profileListStore';

type PendingImport = {
  profile: Profile;
  existingId: string;
};

export function ProfileSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profiles = useProfileListStore(state => state.profiles);
  const createProfile = useProfileListStore(state => state.createProfile);
  const importProfile = useProfileListStore(state => state.importProfile);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  const handleCreate = () => {
    const name = prompt('Enter profile name:');
    const templateLink = prompt('Enter template link:');
    if (name && templateLink) {
      createProfile(name, 'template-id', templateLink);
    }
    close();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const profile = ProfileSchema.parse(JSON.parse(await file.text()));

      const existingIndex = profiles.findIndex(p => p.id === profile.id);

      if (existingIndex >= 0) {
        setPendingImport({ profile, existingId: profile.id });
      } else {
        importProfile(profile, false);
        close();
      }
    } catch (e) {
      const message =
        e instanceof SyntaxError
          ? `Invalid JSON: ${e.message}`
          : e instanceof ZodError
            ? `Invalid profile:\n${e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')}`
            : 'Failed to read file';

      setImportError(message);
    }
    e.target.value = '';
  };

  const handleConflictAction = (action: ImportConflictAction) => {
    if (!pendingImport) return;

    const { profile } = pendingImport;

    switch (action) {
      case 'overwrite':
        importProfile(profile, true);
        break;
      case 'duplicate':
        importProfile(profile, false);
        break;
      case 'cancel':
        break;
    }

    setPendingImport(null);
    close();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const listProps = {
    isOpen,
    onCreate: handleCreate,
    onImport: handleImportClick,
  };

  return (
    <>
      {/* Desktop Dropdown */}
      <ProfileDropdown onToggle={toggle} onClose={close} {...listProps} />

      {/* Save Button */}
      <ProfileExportButton />

      {/* Mobile Drawer */}
      <ProfileDrawer onOpen={open} onClose={close} {...listProps} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <ImportConflictDialog
        isOpen={pendingImport !== null}
        profileName={pendingImport?.profile.name ?? ''}
        profileId={pendingImport?.profile.id ?? ''}
        onAction={handleConflictAction}
      />

      <ErrorDialog
        isOpen={importError !== null}
        title="Import Failed"
        message="Could not import the selected file."
        details={importError ?? undefined}
        onClose={() => setImportError(null)}
      />
    </>
  );
}
