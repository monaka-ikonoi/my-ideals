import { useMemo } from 'react';
import type { TemplateCollection } from '@/domain/template';
import type { Profile } from '@/domain/profile';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { normalizeStatusNumber } from '@/utils/utils';
import { debugLog } from '@/utils/debug';

type CollectionStats = {
  totalItems: number;
  collectedItems: number;
  totalMembers: number;
  completedMembers: number;
  ownedItems: number;
  ownedComps: number;
};

function calculateCollectionStats(
  collection: TemplateCollection,
  statusMap: Profile['collections'][string]
): CollectionStats {
  const result = {
    totalItems: collection.items.length,
    collectedItems: 0,
    ownedItems: 0,
    totalMembers: 0,
    completedMembers: 0,
    ownedComps: 0,
  };

  // Minimal item count of different members
  const memberMinCounts = new Map<string, number>();

  for (const item of collection.items) {
    const count = normalizeStatusNumber(statusMap?.[item.id]);

    if (count > 0) {
      result.collectedItems++;
      result.ownedItems += count;
    }

    const members = Array.isArray(item.member) ? item.member : [item.member];
    for (const m of members) {
      memberMinCounts.set(m, Math.min(count, memberMinCounts.get(m) ?? Infinity));
    }
  }

  result.totalMembers = memberMinCounts.size;
  for (const count of memberMinCounts.values()) {
    if (count > 0) {
      result.completedMembers++;
      result.ownedComps += count;
    }
  }

  return result;
}

export function useCollectionStats(collection: TemplateCollection) {
  const statusMap = useActiveProfileStore(state => state.profile?.collections[collection.id]);

  return useMemo(() => {
    debugLog.perf.time(`calculateCollectionStats: ${collection.id}`);
    const stats = calculateCollectionStats(collection, statusMap ?? {});
    debugLog.perf.timeEnd(`calculateCollectionStats: ${collection.id}`);
    return stats;
  }, [collection, statusMap]);
}
