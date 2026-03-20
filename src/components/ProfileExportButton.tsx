import { type ReactNode } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { DEV_MODE } from '@/utils/appInfo';

type ProfileExportButtonProps = {
  children: ReactNode;
  className?: string;
};

export function ProfileExportButton({ children, className }: ProfileExportButtonProps) {
  const profileLoaded = useActiveProfileStore(state => !!state.profile);

  const handleExport = () => {
    const { profile } = useActiveProfileStore.getState();
    if (!profile) return;

    const filename = `my-ideals-profile-${profile.id}.json`;
    const json = DEV_MODE ? JSON.stringify(profile, null, 2) : JSON.stringify(profile);
    const file = new File([json], filename, { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);

    // Append to DOM, required for iOS Safari to respect the click
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <button type="button" onClick={handleExport} disabled={!profileLoaded} className={className}>
      {children}
    </button>
  );
}
