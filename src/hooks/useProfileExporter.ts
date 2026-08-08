import { useState } from 'react';
import { type Profile, type ProfileBundle } from '@/domain/profile/types';
import { getSessionProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
import { DEV_MODE } from '@/utils/appInfo';
import { downloadFile } from '@/utils/fileUtils';
import { getProfileStorage } from '@/storage/ProfileStorage';

function buildJsonFile(data: object, filename: string): File {
  const json = DEV_MODE ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return new File([json], filename, { type: 'application/json;charset=utf-8' });
}

export function useProfileExporter() {
  const [exporting, setExporting] = useState(false);

  // Must have at least 1 profile to export, check it with active profile
  const canExport = useProfileSessionStore(
    state => !!state.store || (state.loadState.status === 'error' && !!state.loadState.profile)
  );

  const exportProfile = () => {
    if (exporting) return;

    const profile = getSessionProfile();
    if (!profile) return;

    try {
      setExporting(true);
      const filename = `my-ideals-profile-${profile.id}.json`;
      downloadFile(buildJsonFile(profile, filename));
    } finally {
      setExporting(false);
    }
  };

  const exportProfileBundle = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      await useProfileSessionStore.getState().flush();

      const storage = getProfileStorage();
      const ids = await storage.listProfiles();
      const profiles = (await Promise.all(ids.map(id => storage.getProfile(id)))).filter(
        p => p !== null
      ) as Profile[];

      const bundle: ProfileBundle = {
        magic: 'my-ideals-profile-bundle',
        version: 1,
        created: Date.now(),
        profiles,
      };

      const date = new Date().toISOString().slice(0, 10);
      const filename = `my-ideals-profile-bundle-${date}.json`;
      downloadFile(buildJsonFile(bundle, filename));
    } finally {
      setExporting(false);
    }
  };

  return { canExport, exportProfile, exportProfileBundle };
}
