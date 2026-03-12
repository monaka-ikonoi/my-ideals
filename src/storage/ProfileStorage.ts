import type { Profile } from '@/domain/profile';
import { localStorageOps } from './localStorage';

export type ProfileStorageOps = {
  listProfiles: () => Promise<string[]>;
  getProfile: (id: string) => Promise<Profile | null>;
  setProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
};

const ProfileStorageBackends = {
  localStorage: localStorageOps,
};

export const ProfileStorage = ProfileStorageBackends.localStorage;
