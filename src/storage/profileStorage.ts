import { type Profile, ProfileSchema } from '@/domain/profile';
import type { ProfileListEntry } from '@/stores/profileListStore';

const LOCAL_STORAGE_PREFIX = 'my-ideals';
const LOCAL_STORAGE_KEYS = {
  profile: (id: string = '') => `${LOCAL_STORAGE_PREFIX}:profile:${id}`,
} as const;

function scanProfiles(): ProfileListEntry[] {
  const scanned = Object.keys(localStorage)
    .filter(key => key.startsWith(LOCAL_STORAGE_KEYS.profile()))
    .map(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      try {
        const profile = ProfileSchema.parse(JSON.parse(raw));
        return { id: profile.id, name: profile.name };
      } catch {
        console.warn(`scanProfiles: Invalid profile ${key}, skipping...`);
        return null;
      }
    })
    .filter((p): p is ProfileListEntry => p !== null);
  console.log(`scanProfiles: Got ${scanned.length} profiles from localStorage`);
  return scanned;
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
  scanProfiles,
  getProfile,
  setProfile,
  deleteProfile,
};
