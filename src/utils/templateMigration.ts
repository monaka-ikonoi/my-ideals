import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { debugLog } from '@/utils/debug';

function replaceInId(profile: Profile, from: string, to: string) {
  debugLog.sync.log(`Applying migration: replace-in-id: from "${from}" to "${to}"`);

  // Search selectedMembers first
  if (profile.selectedMembers && profile.selectedMembers.length > 0) {
    profile.selectedMembers = Array.from(
      new Set(profile.selectedMembers.map(id => id.replaceAll(from, to)))
    );
  }

  // Then search collections
  if (profile.collections) {
    const newCollections: Profile['collections'] = {};

    for (const [collectionId, items] of Object.entries(profile.collections)) {
      const newCollectionId = collectionId.replaceAll(from, to);
      const newItems: Profile['collections'][string] = {};

      for (const [itemId, itemStatus] of Object.entries(items)) {
        const newItemId = itemId.replaceAll(from, to);
        newItems[newItemId] = itemStatus;
      }

      newCollections[newCollectionId] = {
        ...(newCollections[newCollectionId] || {}),
        ...newItems,
      };
    }
    profile.collections = newCollections;
  }
}

export function applyTemplateMigrations(profile: Profile, template: Template) {
  const profileRevision = profile.template.revision;
  const templateRevision = template.revision;

  if (!template.migrations || profileRevision >= templateRevision || profileRevision === 0) {
    return;
  }

  const pendingRules = template.migrations
    .filter(r => r.revision > profileRevision)
    .sort((a, b) => a.revision - b.revision);

  if (pendingRules.length === 0) return;

  debugLog.sync.log(`Template migration ${profileRevision} -> ${templateRevision}`);
  debugLog.perf.time(`Apply template migrations`);

  for (const r of pendingRules) {
    debugLog.sync.log(`Applying migration for revision ${r.revision}`);
    for (const op of r.operations) {
      switch (op.type) {
        case 'replace-in-id': {
          replaceInId(profile, op.from, op.to);
          break;
        }
      }
    }
  }

  debugLog.sync.log(`Migrations applied successfully.`);
  debugLog.perf.timeEnd(`Apply template migrations`);
}
