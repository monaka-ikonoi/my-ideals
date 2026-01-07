import z from 'zod';
import { type Profile, ProfileSchema } from '@/domain/profile';
import type { ProfileListEntry } from '@/stores/profileListStore';

const LOCAL_STORAGE_PREFIX = 'my-ideals';
const PROFILE_KEY_PREFIX = `${LOCAL_STORAGE_PREFIX}:profile:`;

const LOCAL_STORAGE_KEYS = {
  index: `${LOCAL_STORAGE_PREFIX}:profile-index`,
  profile: (id: string) => `${PROFILE_KEY_PREFIX}${id}`,
} as const;

export type ProfileEntry = {
  id: string;
  name: string;
};

export type ProfileIndex = {
  active: string | null;
  profiles: ProfileEntry[];
};

const ProfileIndexSchema = z.object({
  active: z.string().nullable(),
  profiles: z.array(
    z.object({
      id: z.nanoid(),
      name: z.string(),
    })
  ),
});

function scanProfiles(): ProfileListEntry[] {
  const scanned = Object.keys(localStorage)
    .filter(key => key.startsWith(PROFILE_KEY_PREFIX))
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

function generateProfileIndex(): ProfileIndex | null {
  const profiles = Object.keys(localStorage)
    .filter(key => key.startsWith(PROFILE_KEY_PREFIX))
    .map(key => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      try {
        const profile = ProfileSchema.parse(JSON.parse(raw));
        return { id: profile.id, name: profile.name };
      } catch {
        return null;
      }
    })
    .filter((p): p is ProfileEntry => p !== null);

  if (!profiles || profiles.length === 0) {
    return null;
  }

  return {
    active: profiles[0].id,
    profiles: profiles,
  };
}

function getProfileIndex(): ProfileIndex {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.index);
  if (raw) {
    try {
      return ProfileIndexSchema.parse(JSON.parse(raw));
    } catch (e) {
      console.error('Unable to parse profiles index:', e);
      // TODO: Back up corrupted index?
    }
  }

  console.log('No valid profile index found.');

  // Try to generate index from existing profiles
  const recovered = generateProfileIndex();
  if (recovered) {
    setProfileIndex(recovered);
    return recovered;
  }

  // Return empty index
  const emptyIndex: ProfileIndex = { active: null, profiles: [] };
  setProfileIndex(emptyIndex);
  return emptyIndex;
}

function setProfileIndex(index: ProfileIndex): void {
  console.log(index);
  ProfileIndexSchema.parse(index);
  localStorage.setItem(LOCAL_STORAGE_KEYS.index, JSON.stringify(index));
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
  getProfileIndex,
  setProfileIndex,
  scanProfiles,
  getProfile,
  setProfile,
  deleteProfile,
};
