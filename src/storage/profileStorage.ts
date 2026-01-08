import { type Profile, ProfileSchema } from '@/domain/profile';
import { z } from 'zod';

const LOCAL_STORAGE_PREFIX = 'my-ideals';
const LOCAL_STORAGE_KEYS = {
  profile: (id: string = '') => `${LOCAL_STORAGE_PREFIX}:profile:${id}`,
} as const;

function listProfiles(): string[] {
  const prefix = LOCAL_STORAGE_KEYS.profile();
  return Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .map(key => key.slice(prefix.length))
    .filter(id => z.nanoid().safeParse(id).success);
}

function getProfile(id: string): Profile | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.profile(id));
  if (!raw) {
    return null;
  }

  try {
    return ProfileSchema.parse(JSON.parse(raw));
  } catch (e) {
    console.error(`Unable to parse profile: ${id}:`, e);
    return null;
  }
}

function setProfile(profile: Profile): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.profile(profile.id), JSON.stringify(profile));
}

function deleteProfile(id: string): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.profile(id));
}

export const ProfileStorage = {
  listProfiles,
  getProfile,
  setProfile,
  deleteProfile,
};
