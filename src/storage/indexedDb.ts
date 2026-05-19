import { z } from 'zod';
import { createStore, get, set, del, keys } from 'idb-keyval';
import type { ProfileStorageOps } from './ProfileStorage';
import { type Profile, ProfileSchema } from '@/domain/profile';
import { debugLog } from '@/utils/debug';

const profileStore = createStore('my-ideals', 'profiles');

const listProfiles = async (): Promise<string[]> => {
  const allKeys = await keys(profileStore);
  return allKeys
    .filter((key): key is string => typeof key === 'string')
    .filter(id => z.nanoid().safeParse(id).success);
};

const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const raw = await get<unknown>(id, profileStore);
    if (!raw) {
      return null;
    }
    return ProfileSchema.parse(raw);
  } catch (e) {
    debugLog.storage.error(`Unable to get profile: ${id}:`, e);
    return null;
  }
};

const setProfile = async (profile: Profile): Promise<void> => {
  await set(profile.id, profile, profileStore);
};

const deleteProfile = async (id: string): Promise<void> => {
  await del(id, profileStore);
};

export const indexedDbOps: ProfileStorageOps = {
  listProfiles,
  getProfile,
  setProfile,
  deleteProfile,
};
