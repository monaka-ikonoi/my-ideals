// hooks/useProfileManager.ts
import { useCallback } from 'react';
import { useImmer } from 'use-immer';
import { nanoid } from 'nanoid';
import { ProfileStorage, type ProfileIndex, type ProfileSummary } from '@/storage/localStorage';

export function useProfileManager() {
  const [index, setIndex] = useImmer<ProfileIndex>(ProfileStorage.getProfileIndex());

  // TODO: validate profile index data on startup

  const setActiveProfile = useCallback(
    (profileId: string) => {
      setIndex(draft => {
        draft.active = profileId;
      });
    },
    [setIndex]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      ProfileStorage.deleteProfile(profileId);

      const newProfiles = index.profiles.filter(p => p.id !== profileId);
      const newActiveId = index.active === profileId ? (newProfiles[0]?.id ?? null) : index.active;
      setIndex(draft => {
        draft.active = newActiveId;
        draft.profiles = newProfiles;
      });
    },
    [index, setIndex]
  );

  const renameProfile = useCallback(
    (profileId: string, newName: string) => {
      const profile = ProfileStorage.getProfile(profileId);
      if (!profile) {
        console.error(`renameProfile: Profile ${profileId} not found`);
        return;
      }

      ProfileStorage.setProfile({ ...profile, name: newName });
      setIndex(draft => ({
        ...draft,
        profiles: draft.profiles.map(p => (p.id === profileId ? { ...p, name: newName } : p)),
      }));
    },
    [setIndex]
  );

  const exportProfile = useCallback((profileId: string) => {
    const profile = ProfileStorage.getProfile(profileId);
    if (!profile) {
      console.error(`exportProfile: Profile ${profileId} not found`);
      return;
    }

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `my-ideals-profile-${profile.name}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }, []);

  const activeProfile: ProfileSummary | null =
    index.profiles.find(p => p.id === index.active) || null;

  return {
    profiles: index.profiles,
    activeProfile,
    setActiveProfile,
    deleteProfile,
    renameProfile,
    exportProfile,
  };
}
