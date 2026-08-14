import { z } from 'zod';
import { type GetProfileResult, type ProfileStorageOps } from './ProfileStorage';
import { type Profile, ProfileSchema } from '@/domain/profile';
import { debugLog } from '@/utils/debug';
import { getErrorMessage } from '@/utils/error';

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

const getProfile = async (id: string): Promise<GetProfileResult> => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LOCAL_STORAGE_KEYS.profile(id));
  } catch (e) {
    debugLog.storage.error(`Unable to read profile ${id}:`, e);
    return { success: false, message: `LocalStorage error: ${getErrorMessage(e)}` };
  }
  if (raw === null) {
    return { success: false, message: 'Profile not found' };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    debugLog.storage.error(`Unable to parse profile ${id}:`, e);
    return { success: false, message: `Invalid profile: ${getErrorMessage(e)}` };
  }

  const parsed = ProfileSchema.safeParse(data);
  if (!parsed.success) {
    debugLog.storage.error(`Invalid profile ${id}:`, parsed.error);
    return { success: false, message: `Invalid profile:\n${z.prettifyError(parsed.error)}` };
  }
  return { success: true, profile: parsed.data };
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
