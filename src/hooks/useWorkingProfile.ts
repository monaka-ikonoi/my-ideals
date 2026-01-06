import { useEffect, useState, useCallback } from 'react';
import { ProfileSchema } from '../schema/profile';
import { TemplateSchema } from '../schema/template';
import {
  type WorkingProfile,
  buildWorkingProfile,
  extractProfileFromWorking,
  toggleItemStatus,
} from '../domain/working';

export function useWorkingProfile(profileId: string) {
  const [working, setWorking] = useState<WorkingProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rawProfile = localStorage.getItem(`my-ideals:profile:${profileId}`);
        if (!rawProfile) throw new Error('Profile not found');

        const profile = ProfileSchema.parse(JSON.parse(rawProfile));

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
  }, [profileId]);

  const saveProfile = useCallback(() => {
    if (!working) return;

    const profile = extractProfileFromWorking(working);
    console.log('Saving profile:', profile);
    ProfileSchema.parse(profile);
    localStorage.setItem(`my-ideals:profile:${profileId}`, JSON.stringify(profile));
  }, [working, profileId]);

  const toggleStatus = useCallback((collectionId: string, itemId: string) => {
    console.log(`Toggling collection ${collectionId}, item ${itemId}`);
    setWorking(prev => {
      if (!prev) {
        return prev;
      }
      return toggleItemStatus(prev, collectionId, itemId);
    });
  }, []);

  useEffect(() => {
    if (working && !isLoading) {
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
