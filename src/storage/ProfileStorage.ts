import type { Profile } from '@/domain/profile';
import { localStorageOps } from './localStorage';
import { indexedDbOps } from './indexedDb';
import { getStorageBackend } from './runtime';

export type ProfileStorageOps = {
  listProfiles: () => Promise<string[]>;
  getProfile: (id: string) => Promise<Profile | null>;
  setProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
};

const ProfileStorageBackends = {
  localStorage: localStorageOps,
  indexedDb: indexedDbOps,
};

export const getProfileStorage = (): ProfileStorageOps =>
  ProfileStorageBackends[getStorageBackend()];
