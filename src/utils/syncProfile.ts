import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { debugLog } from './debug';

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

export function syncProfileWithTemplate(
  profile: Profile,
  template: Template,
  cleanup: boolean
): Profile {
  debugLog.sync.log(
    `Sync template ${template.id} from ${profile.template.revision} to ${template.revision}`
  );

  if (template.revision < profile.template.revision) {
    console.warn(
      `SyncProfile: Template revision ${template.revision} is less than profile recorded ${profile.template.revision}`
    );
  }

  let collections: Profile['collections'] = {};

  if (cleanup) {
    // Remove entries not in template and add new entries
    for (const tc of template.collections) {
      const existing = profile.collections[tc.id] ?? {};
      collections[tc.id] = {};

      for (const item of tc.items) {
        collections[tc.id][item.id] = existing[item.id] ?? false;
      }
    }
  } else {
    // Add new entries only
    collections = { ...profile.collections };
    for (const tc of template.collections) {
      if (!collections[tc.id]) {
        collections[tc.id] = {};
      }
      for (const item of tc.items) {
        if (!(item.id in collections[tc.id])) {
          collections[tc.id][item.id] = false;
        }
      }
    }
  }

  return {
    ...profile,
    collections,
    template: {
      ...profile.template,
      revision: template.revision,
    },
  };
}
