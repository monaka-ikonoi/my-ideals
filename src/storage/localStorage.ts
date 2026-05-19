import { z } from 'zod';
import type { ProfileStorageOps } from './ProfileStorage';
import { type Profile, ProfileSchema } from '@/domain/profile';
import { debugLog } from '@/utils/debug';

const LOCAL_STORAGE_PREFIX = 'my-ideals';
const LOCAL_STORAGE_KEYS = {
  profile: (id: string = '') => `${LOCAL_STORAGE_PREFIX}:profile:${id}`,
} as const;

const listProfiles = async (): Promise<string[]> => {
  const prefix = LOCAL_STORAGE_KEYS.profile();
  return Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .map(key => key.slice(prefix.length))
    .filter(id => z.nanoid().safeParse(id).success);
};

const getProfile = async (id: string): Promise<Profile | null> => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.profile(id));
  if (!raw) {
    return null;
  }

  try {
    return ProfileSchema.parse(JSON.parse(raw));
  } catch (e) {
    debugLog.storage.error(`Unable to parse profile: ${id}:`, e);
    return null;
  }
};

const setProfile = async (profile: Profile): Promise<void> => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.profile(profile.id), JSON.stringify(profile));
};

const deleteProfile = async (id: string): Promise<void> => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.profile(id));
};

export const localStorageOps: ProfileStorageOps = {
  listProfiles,
  getProfile,
  setProfile,
  deleteProfile,
};
