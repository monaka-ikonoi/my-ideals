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

    const json = DEV_MODE ? JSON.stringify(profile, null, 2) : JSON.stringify(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `my-ideals-profile-${profile.id}.json`;
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button type="button" onClick={handleExport} disabled={!profileLoaded} className={className}>
      {children}
    </button>
  );
}
