import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';

export type ItemChange = {
  id: string;
  name?: string;
};

export type CollectionChange = {
  id: string;
  name?: string;
  items: ItemChange[];
};

type Changes = {
  added: CollectionChange[];
  removed: CollectionChange[];
};

export type ProfileTemplateDiff = Changes;

export function diffProfileWithTemplate(profile: Profile, template: Template): Changes {
  const profileItemKeys = new Set<string>();
  for (const collectionId in profile.collections) {
    for (const itemId in profile.collections[collectionId]) {
      profileItemKeys.add(`${collectionId}:${itemId}`);
    }
  }

  const templateItemKeys = new Set<string>();
  for (const collection of template.collections) {
    for (const item of collection.items) {
      templateItemKeys.add(`${collection.id}:${item.id}`);
    }
  }

  // Added
  const addedMap = new Map<string, CollectionChange>();
  for (const collection of template.collections) {
    for (const item of collection.items) {
      const key = `${collection.id}:${item.id}`;
      if (!profileItemKeys.has(key)) {
        if (!addedMap.has(collection.id)) {
          addedMap.set(collection.id, {
            id: collection.id,
            name: collection.name,
            items: [],
          });
        }
        addedMap.get(collection.id)!.items.push({
          id: item.id,
          name: item.name,
        });
      }
    }
  }

  // Removed
  const collectionNameMap = new Map<string, string>();
  for (const collection of template.collections) {
    collectionNameMap.set(collection.id, collection.name);
  }

  const removedMap = new Map<string, CollectionChange>();
  for (const collectionId in profile.collections) {
    for (const itemId in profile.collections[collectionId]) {
      const key = `${collectionId}:${itemId}`;
      if (!templateItemKeys.has(key)) {
        if (!removedMap.has(collectionId)) {
          removedMap.set(collectionId, {
            id: collectionId,
            name: collectionNameMap.get(collectionId),
            items: [],
          });
        }
        removedMap.get(collectionId)!.items.push({
          id: itemId,
        });
      }
    }
  }

  return {
    added: Array.from(addedMap.values()),
    removed: Array.from(removedMap.values()),
  };
}

export function syncProfileWithTemplate(profile: Profile, template: Template): Profile {
  const syncedCollections: Profile['collections'] = {};

  for (const tc of template.collections) {
    const existing = profile.collections[tc.id] ?? {};
    syncedCollections[tc.id] = {};

    for (const item of tc.items) {
      syncedCollections[tc.id][item.id] = existing[item.id] ?? false;
    }
  }

  return {
    ...profile,
    collections: syncedCollections,
    template: {
      ...profile.template,
      revision: template.revision,
    },
  };
}
