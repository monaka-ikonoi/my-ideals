import type { Profile } from '@/domain/profile';
import { localStorageOps } from './localStorage';
import { indexedDbOps } from './indexedDb';
import { getStorageBackend, type StorageBackend } from './runtime';

export type GetProfileResult =
  { success: true; profile: Profile } | { success: false; message: string };

export type ProfileStorageOps = {
  listProfiles: () => Promise<string[]>;
  getProfile: (id: string) => Promise<GetProfileResult>;
  setProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
};

const ProfileStorageBackends = {
  localStorage: localStorageOps,
  indexedDb: indexedDbOps,
};

export const getProfileStorage = (backend?: StorageBackend): ProfileStorageOps =>
  ProfileStorageBackends[backend ?? getStorageBackend()];
