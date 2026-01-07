import { useEffect, useState, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { ProfileSchema } from '@/domain/profile';
import { TemplateSchema } from '@/domain/template';
import {
  type WorkingProfile,
  buildWorkingProfile,
  extractProfileFromWorking,
} from '@/domain/working';
import { ProfileStorage } from '@/storage/profileStorage';

export function useWorkingProfile(profileId: string) {
  const [working, setWorking] = useImmer<WorkingProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = ProfileStorage.getProfile(profileId);
        if (!profile) throw new Error('Profile not found');

        const res = await fetch(profile.templateLink);
        const template = TemplateSchema.parse(await res.json());

        if (cancelled) return;

        setWorking(buildWorkingProfile(profile, template));
      } catch (e) {
        console.error('Error loading working profile:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileId, setWorking]);

  const saveProfile = useCallback(() => {
    if (!working) return;

    const profile = extractProfileFromWorking(working);
    console.log('Saving profile:', profile);
    ProfileSchema.parse(profile);
    localStorage.setItem(`my-ideals:profile:${profileId}`, JSON.stringify(profile));
  }, [working, profileId]);

  const toggleStatus = useCallback(
    (collectionId: string, itemId: string) => {
      console.log(`Toggling collection ${collectionId}, item ${itemId}`);
      setWorking(draft => {
        if (!draft) return;
        const collection = draft.collections.find(c => c.id === collectionId);
        if (!collection) return;
        const item = collection.items.find(i => i.id === itemId);
        if (!item) return;
        item.status = !item.status;
      });
    },
    [setWorking]
  );

  useEffect(() => {
    if (working && !isLoading) {
      // TODO: Not saving on loading, use debounce?
      saveProfile();
    }
  }, [working, isLoading, saveProfile]);

  return {
    working,
    setWorking,
    toggleStatus,
    saveProfile,
    isLoading,
    error,
  };
}
