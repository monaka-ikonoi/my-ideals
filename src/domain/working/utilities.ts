import { type WorkingCollection, type WorkingProfile } from './types';
import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';

export function buildWorkingProfile(profile: Profile, template: Template): WorkingProfile {
  const { collections: profileCollections, ...profileMeta } = profile;
  const { collections: templateCollections, ...templateMeta } = template;

  const collections: WorkingCollection[] = templateCollections.map(tc => {
    const statusMap = profileCollections[tc.id] || {};

    return {
      id: tc.id,
      name: tc.name,
      items: tc.items.map(item => ({
        ...item,
        status: statusMap[item.id] ?? false,
      })),
    };
  });

  return {
    template: templateMeta,
    profile: profileMeta,
    collections,
  };
}

export function extractProfileFromWorking(working: WorkingProfile): Profile {
  const { collections: WorkingCollections, profile } = working;

  return {
    ...profile,
    collections: Object.fromEntries(
      WorkingCollections.map(collection => [
        collection.id,
        Object.fromEntries(collection.items.map(item => [item.id, item.status])),
      ])
    ),
  };
}
