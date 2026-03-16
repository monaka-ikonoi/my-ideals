import { type ReactNode } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { DEV_MODE } from '@/utils/appInfo';

type ProfileExportButtonProps = {
  children: ReactNode;
  className?: string;
};

export function ProfileExportButton({ children, className }: ProfileExportButtonProps) {
  const profile = useActiveProfileStore(state => state.profile);

  const handleExport = () => {
    if (!profile) return;

    const json = DEV_MODE ? JSON.stringify(profile, null, 2) : JSON.stringify(profile);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `my-ideals-profile-${profile.id}.json`;
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} disabled={!profile} className={className}>
      {children}
    </button>
  );
}
