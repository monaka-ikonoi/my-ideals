import { type WorkingCollection, type WorkingProfile } from './types';
import { type Profile } from '../profile';
import { type Template } from '../template';

export function buildWorkingProfile(profile: Profile, template: Template): WorkingProfile {
  const { collections: profileCollections, ...profileMeta } = profile;
  const { collections: templateCollections, ...templateMeta } = template;

  const collections: WorkingCollection[] = templateCollections.map(tc => {
    const statusMap = profileCollections[tc.id] || {};

    return {
      id: tc.id,
      name: tc.name,
      items: tc.items.map(item => ({
        id: item.id,
        member: item.member,
        title: item.title,
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

export function toggleItemStatus(
  working: WorkingProfile,
  collectionId: string,
  itemId: string
): WorkingProfile {
  return {
    ...working,
    collections: working.collections.map(collection =>
      collection.id === collectionId
        ? {
            ...collection,
            items: collection.items.map(item =>
              item.id === itemId ? { ...item, status: !item.status } : item
            ),
          }
        : collection
    ),
  };
}
