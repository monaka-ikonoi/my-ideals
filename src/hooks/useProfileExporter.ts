import { useState } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { DEV_MODE } from '@/utils/appInfo';
import { downloadFile } from '@/utils/fileUtils';

function buildJsonFile(data: {}, filename: string): File {
  const json = DEV_MODE ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return new File([json], filename, { type: 'application/json;charset=utf-8' });
}

export function useProfileExporter() {
  const [exporting, setExporting] = useState(false);

  // Must have at least 1 profile to export, check it with active profile
  const canExport = useActiveProfileStore(state => !!state.profile);

  const exportProfile = () => {
    if (exporting) return;

    const { profile } = useActiveProfileStore.getState();
    if (!profile) return;

    try {
      setExporting(true);
      const filename = `my-ideals-profile-${profile.id}.json`;
      downloadFile(buildJsonFile(profile, filename));
    } finally {
      setExporting(false);
    }
  };

  return { canExport, exportProfile };
}
