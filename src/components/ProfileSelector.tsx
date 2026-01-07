import { useState } from 'react';
import { ProfileDropdown } from './ProfileDropdown';
import { ProfileDrawer } from './ProfileDrawer';
import { ProfileExportButton } from './ProfileExportButton';

export function ProfileSelector() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return (
    <>
      {/* Desktop Dropdown */}
      <ProfileDropdown isOpen={isOpen} onToggle={toggle} onClose={close} />

      {/* Save Button */}
      <ProfileExportButton />

      {/* Mobile Drawer */}
      <ProfileDrawer isOpen={isOpen} onOpen={open} onClose={close} />
    </>
  );
}
