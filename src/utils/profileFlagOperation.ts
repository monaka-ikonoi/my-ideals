import { ProfileFlags, type Profile, type ProfileFlag } from '@/domain/profile';
import { normalizeStatusBoolean, normalizeStatusNumber } from './utils';

function convertItemStatus(profile: Profile, op: (value: boolean | number) => boolean | number) {
  const collections = Object.values(profile.collections);
  for (const collection of collections) {
    const itemIds = Object.keys(collection);
    for (const itemId of itemIds) {
      collection[itemId] = op(collection[itemId]);
    }
  }
}

type ProfileFlagOperationMap = Map<ProfileFlag, Map<boolean, (profile: Profile) => void>>;

export const ProfileFlagOperations: ProfileFlagOperationMap = new Map([
  [
    ProfileFlags.ENABLE_COUNT,
    new Map([
      [true, (profile: Profile) => convertItemStatus(profile, normalizeStatusNumber)],
      [false, (profile: Profile) => convertItemStatus(profile, normalizeStatusBoolean)],
    ]),
  ],
]);
