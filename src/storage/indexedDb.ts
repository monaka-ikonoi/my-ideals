import { z } from 'zod';
import { createStore, get, set, del, keys } from 'idb-keyval';
import { type GetProfileResult, type ProfileStorageOps } from './ProfileStorage';
import { type Profile, ProfileSchema } from '@/domain/profile';
import { debugLog } from '@/utils/debug';
import { getErrorMessage } from '@/utils/error';

const profileStore = createStore('my-ideals', 'profiles');

const listProfiles = async (): Promise<string[]> => {
  const allKeys = await keys(profileStore);
  return allKeys
    .filter((key): key is string => typeof key === 'string')
    .filter(id => z.nanoid().safeParse(id).success);
};

const getProfile = async (id: string): Promise<GetProfileResult> => {
  let raw: unknown;
  try {
    raw = await get<unknown>(id, profileStore);
  } catch (e) {
    debugLog.storage.error(`Unable to read profile ${id}:`, e);
    return { success: false, message: `IndexedDB error: ${getErrorMessage(e)}` };
  }
  if (raw === undefined) {
    return { success: false, message: 'Profile not found' };
  }

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    debugLog.storage.error(`Invalid profile ${id}:`, parsed.error);
    return { success: false, message: `Invalid profile:\n${getErrorMessage(parsed.error)}` };
  }
  return { success: true, profile: parsed.data };
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
